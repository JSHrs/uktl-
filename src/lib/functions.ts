import { validateCvUpload } from "./server/upload-validation";
import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/start-server-core";
import { z } from "zod";

import { getEnv } from "./server/env";
import {
  createBooking,
  createEnquiry,
  createFaqTopic,
  createJob,
  deleteCandidate,
  deleteFaqTopic,
  deleteJob,
  getAdminAnalytics,
  getCandidate,
  getCandidateAuthUserId,
  getFaqTopic,
  getJob,
  getLatestCandidateIdForUser,
  getMatchesForCandidate,
  getMatchesForJob,
  getSwipedJobIds,
  incrementFaqView,
  insertCandidateShell,
  listAllFaqTopics,
  listAllJobs,
  listBookings,
  listCandidates,
  listEnquiries,
  setEnquiryStatus,
  listFaqTopics,
  listJobs,
  markCandidateFailed,
  markCandidateParsing,
  recordSwipe,
  setMatchStage,
  updateFaqTopic,
  updateJob,
  upsertMatches,
  writeParsedProfile,
  type FaqTopic,
  type FaqTopicInput,
  type JobInput,
} from "./server/db";
import { hasStaffAccess, readStaffAccess } from "./server/staff-access";
import {
  canAccessCandidate,
  getStaffAccess,
  requireStaff,
  getViewer,
  requireAdmin,
  requireViewer,
} from "./server/viewer";
import { enforceRateLimit } from "./server/ratelimit";
import { deliverNotification } from "./server/notify";
import { syncReedJobs } from "./server/reed";
import { parseCv } from "./server/parse";
import { scoreMatch } from "./server/match";
import { normaliseSkillList } from "./server/skills";
import { anonymiseProfile } from "./server/anonymize";
import { extractDocxText } from "./server/docx";
import { ParsedProfileSchema } from "./schemas/profile";
import { MatchStageEnum } from "./schemas/job";

const ID_PREFIX = "cand_";
function newId(): string {
  return (
    ID_PREFIX +
    crypto.randomUUID().replace(/-/g, "").slice(0, 20)
  );
}

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

function authCallbackUrl(env: { SITE_URL?: string }): string {
  if (!env.SITE_URL) throw new Error("SITE_URL not configured");
  return `${env.SITE_URL.replace(/\/+$/, "")}/auth/callback`;
}

export const getViewerFn = createServerFn({ method: "GET" }).handler(async () => getViewer());

export const listCandidatesFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const viewer = await getViewer();
    const scope = viewer.isStaff ? {} : viewer.userId ? { authUserId: viewer.userId } : null;
    if (!scope) return [];
    try {
      const env = await getEnv();
      return await listCandidates(env, scope);
    } catch {
      throw new Error("Data is temporarily unavailable. Please try again.");
    }
  },
);

export const getCandidateDetailFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    const viewer = await getViewer();
    try {
      const env = await getEnv();
      const candidate = await getCandidate(env, data.id);
      if (!candidate || !canAccessCandidate(viewer, candidate.auth_user_id)) return null;
      const matches = await getMatchesForCandidate(env, data.id);
      return { candidate, matches };
    } catch {
      throw new Error("Data is temporarily unavailable. Please try again.");
    }
  });

export const getAnonymisedCandidateFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    const viewer = await getViewer();
    try {
      const env = await getEnv();
      const row = await getCandidate(env, data.id);
      if (!row?.source_r2_key || !canAccessCandidate(viewer, row.auth_user_id)) return null;
      const rawProfile = await env.DB.prepare(
        `SELECT raw_profile FROM candidates WHERE id=?`,
      )
        .bind(data.id)
        .first<{ raw_profile: string | null }>();
      if (!rawProfile?.raw_profile) return null;
      const profile = ParsedProfileSchema.parse(
        JSON.parse(rawProfile.raw_profile),
      );
      return anonymiseProfile(profile);
    } catch {
      throw new Error("Data is temporarily unavailable. Please try again.");
    }
  });

export const listJobsFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const env = await getEnv();
    return await listJobs(env);
  } catch {
    return [];
  }
});

export const getJobDetailFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    const viewer = await getViewer();
    try {
      const env = await getEnv();
      const job = await getJob(env, data.id);
      if (!job) return null;
      // Pipeline rows carry candidate names — consultants only.
      const matches = viewer.isStaff ? await getMatchesForJob(env, data.id) : [];
      return { job, matches, canManage: !!viewer.isStaff };
    } catch {
      throw new Error("Data is temporarily unavailable. Please try again.");
    }
  });

export const setMatchStageFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({ candidateId: z.string(), jobId: z.string(), stage: MatchStageEnum }).parse(raw),
  )
  .handler(async ({ data }) => {
    await requireStaff();
    const env = await getEnv();
    const changed = await setMatchStage(env, data.candidateId, data.jobId, data.stage);
    if (!changed) throw new Error("Match not found");
    return { ok: true as const };
  });

// Core automation entry-point.
// Flow: receive file → write to R2 → insert candidate shell → parse via LLM →
// persist structured profile + skills + experience → score against every open
// job → persist matches. Client-facing effect: after one upload the candidate
// is searchable, ranked, and shortlistable with zero consultant effort.
export const uploadAndParseCvFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown): FormData => {
    if (!(raw instanceof FormData)) {
      throw new Error("Expected multipart form data");
    }
    return raw;
  })
  .handler(async ({ data }) => {
    const viewer = await requireViewer();
    const file = data.get("file");
    if (!(file instanceof File)) {
      throw new Error("No file uploaded");
    }
    if (file.size > 10 * 1024 * 1024) {
      throw new Error("File exceeds 10 MB limit");
    }
    const allowedTypes = ["application/pdf", DOCX_MIME, "text/plain", ""];
    const lower = file.name.toLowerCase();
    if (!allowedTypes.includes(file.type) && !lower.match(/\.(pdf|docx|txt)$/)) {
      throw new Error("Unsupported file type — upload PDF, DOCX, or TXT");
    }
    const { getCandidateSession, getSupabaseAdmin } = await import("./supabase");
    const session = await getCandidateSession();
    let env: Awaited<ReturnType<typeof getEnv>>;
    try {
      env = await getEnv();
    } catch {
      throw new Error("CV processing is unavailable — runtime bindings are not configured");
    }
    await enforceRateLimit(env, "cvUpload", viewer.userId ?? "admin");
    if (!env.ANTHROPIC_API_KEY) throw new Error("CV processing is not configured");
    const bytes = await file.arrayBuffer();
    const validated = validateCvUpload(file.name, bytes);
    // Reject malformed/oversized DOCX content before writing a private object.
    const docxText = validated.kind === "docx" ? extractDocxText(bytes) : null;
    const id = newId();
    const r2Key = `cvs/${id}/${sanitiseFilename(file.name)}`;

    await env.CV_BUCKET.put(r2Key, bytes, {
      httpMetadata: { contentType: validated.contentType },
    });
    await insertCandidateShell(env, {
      id,
      filename: file.name,
      r2Key,
      sizeBytes: bytes.byteLength,
      authUserId: session.userId,
    });
    if (session.userId) {
      // Mirror the link onto the Supabase profile; candidates.auth_user_id is authoritative.
      try {
        const admin = await getSupabaseAdmin();
        await admin
          .from("profiles")
          .update({ d1_candidate_id: id, updated_at: new Date().toISOString() })
          .eq("id", session.userId);
      } catch { /* service role not configured */ }
    }
    await markCandidateParsing(env, id);

    try {
      const isPdf = validated.kind === "pdf";
      const isDocx = validated.kind === "docx";
      const parseInput = isPdf
        ? ({ kind: "pdf", bytes, filename: file.name } as const)
        : ({
            kind: "text",
            text: isDocx ? docxText! : new TextDecoder().decode(bytes),
            filename: file.name,
          } as const);

      const { profile, quality } = await parseCv(parseInput, {
        apiKey: env.ANTHROPIC_API_KEY,
        model: env.PARSE_MODEL,
      });
      const normalisedSkills = normaliseSkillList(
        (profile.skills ?? []).map((s) => s.skill),
      );
      await writeParsedProfile(env, id, profile, normalisedSkills, quality);

      // Auto-match: score the new candidate against every open job.
      const jobs = await listJobs(env);
      const matches = jobs.map((job) =>
        scoreMatch(profile, normalisedSkills, job),
      );
      await upsertMatches(env, id, matches);

      return { id, status: "parsed" as const, quality };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      await markCandidateFailed(env, id, msg);
      return { id, status: "failed" as const, error: msg };
    }
  });

export const getDiscoverJobsFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({ candidateId: z.string().optional() }).parse(raw),
  )
  .handler(async ({ data }) => {
    try {
      const env = await getEnv();
      const allJobs = await listJobs(env);
      let unseenJobs = allJobs;
      const matchMap: Record<string, number> = {};

      const owner = data.candidateId ? await getCandidateAuthUserId(env, data.candidateId) : undefined;
      const canUseCandidate =
        !!data.candidateId && owner !== undefined && canAccessCandidate(await getViewer(), owner);

      if (data.candidateId && canUseCandidate) {
        const swipedIds = new Set(await getSwipedJobIds(env, data.candidateId));
        unseenJobs = allJobs.filter((j) => !swipedIds.has(j.id));
        const candidateMatches = await getMatchesForCandidate(env, data.candidateId);
        candidateMatches.forEach((m) => {
          matchMap[m.job_id] = m.score;
        });
      }

      return { jobs: unseenJobs, matches: matchMap };
    } catch {
      return { jobs: [], matches: {} };
    }
  });

export const recordSwipeFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z
      .object({
        candidateId: z.string(),
        jobId: z.string(),
        action: z.enum(["interested", "dismissed"]),
      })
      .parse(raw),
  )
  .handler(async ({ data }) => {
    try {
      const env = await getEnv();
      const owner = await getCandidateAuthUserId(env, data.candidateId);
      if (owner === undefined || !canAccessCandidate(await getViewer(), owner)) return { ok: false };
      await recordSwipe(env, data.candidateId, data.jobId, data.action);
      return { ok: true };
    } catch {
      return { ok: false };
    }
  });

// ── HR / Employment Law functions ─────────────────────────────────────────────

const STOP_WORDS = new Set([
  "a","an","the","is","it","in","on","at","to","for","of","and","or","my","i",
  "am","are","was","be","been","do","does","did","have","has","had","not","with",
  "me","we","you","can","will","what","how","when","why","who","which","this",
  "that","about","if","but","so","get","give","make",
]);

function scoreTopicMatch(question: string, topic: FaqTopic, categoryHint?: string): number {
  const words = question
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));

  let score = 0;

  // Category match bonus
  if (categoryHint && topic.category === categoryHint) score += 20;

  // Keyword overlap
  const topicText = [
    topic.title.toLowerCase(),
    ...topic.keywords.map((k) => k.toLowerCase()),
  ].join(" ");

  for (const w of words) {
    if (topicText.includes(w)) score += 10;
  }

  // Exact multi-word phrase match in keywords
  for (const kw of topic.keywords) {
    if (question.toLowerCase().includes(kw.toLowerCase())) score += 15;
  }

  return score;
}

export const matchFaqTopicFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({
      question: z.string().min(1),
      category: z.string().optional(),
    }).parse(raw),
  )
  .handler(async ({ data }) => {
    let topics: FaqTopic[];
    try {
      const env = await getEnv();
      topics = await listFaqTopics(env);
    } catch {
      topics = [];
    }

    const scored = topics
      .map((t) => ({ topic: t, score: scoreTopicMatch(data.question, t, data.category) }))
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score);

    const best = scored[0] ?? null;
    const related = scored.slice(1, 3).map((x) => x.topic);

    return {
      match: best ? { topic: best.topic, confidence: best.score >= 25 ? "high" : "low" } : null,
      related,
    };
  });

export const listFaqTopicsFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) =>
    z.object({
      category: z.string().optional(),
      sector: z.string().optional(),
    }).parse(raw),
  )
  .handler(async ({ data }) => {
    try {
      const env = await getEnv();
      return await listFaqTopics(env, data);
    } catch {
      return [];
    }
  });

export const recordFaqViewFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    try {
      const env = await getEnv();
      await incrementFaqView(env, data.id);
    } catch {
      // best-effort
    }
    return { ok: true };
  });

const ACAS_SYSTEM_PROMPT = `You are a UK employment law information assistant for UK Talent Link, \
a platform serving candidates and businesses in the Construction and Technology sectors.

Provide clear, accurate information grounded in ACAS guidance and current UK employment law \
(Employment Rights Act 1996, Equality Act 2010, Working Time Regulations 1998, and related legislation). \
Keep responses practical, concise, and structured: use short paragraphs or brief bullet points. \
Aim for 3–5 paragraphs maximum. Where appropriate, reference the relevant Act or ACAS code of practice.

IMPORTANT: Always end your response with this exact sentence on its own line:
"This information is for general guidance only and does not constitute legal advice. \
For your specific situation, speaking with a qualified employment lawyer is recommended."`;

export const escalateToAiFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({
      question: z.string().trim().min(1).max(4000),
      category: z.string().max(100).optional(),
      additionalContext: z.string().max(8000).optional(),
    }).parse(raw),
  )
  .handler(async ({ data }) => {
    const viewer = await requireViewer();
    const env = await getEnv();
    await enforceRateLimit(env, "aiEscalation", viewer.userId ?? "admin");
    const apiKey = env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error("AI guidance is currently unavailable");

    const userMessage = [
      `Question: ${data.question}`,
      data.category ? `Topic category: ${data.category}` : "",
      data.additionalContext ? `Additional context: ${data.additionalContext}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1024,
        system: ACAS_SYSTEM_PROMPT,
        messages: [{ role: "user", content: userMessage }],
      }),
    });

    if (!res.ok) {
      const body = await res.text();
      throw new Error(`Anthropic error ${res.status}: ${body.slice(0, 300)}`);
    }

    const payload = (await res.json()) as {
      content?: Array<{ type: string; text?: string }>;
    };
    const text = payload.content?.find((c) => c.type === "text")?.text?.trim() ?? "";
    return { response: text, source: "claude" };
  });

export const rematchCandidateFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    const env = await getEnv();
    const detail = await getCandidate(env, data.id);
    if (!detail || !canAccessCandidate(await getViewer(), detail.auth_user_id)) {
      throw new Error("Candidate not found");
    }
    const rawRow = await env.DB.prepare(
      `SELECT raw_profile FROM candidates WHERE id=?`,
    )
      .bind(data.id)
      .first<{ raw_profile: string | null }>();
    if (!rawRow?.raw_profile) throw new Error("No parsed profile on record");
    const profile = ParsedProfileSchema.parse(JSON.parse(rawRow.raw_profile));
    const normalisedSkills = normaliseSkillList(
      (profile.skills ?? []).map((s) => s.skill),
    );
    const jobs = await listJobs(env);
    const matches = jobs.map((job) => scoreMatch(profile, normalisedSkills, job));
    await upsertMatches(env, data.id, matches);
    return { count: matches.length };
  });

function sanitiseFilename(name: string): string {
  return name.replace(/[^A-Za-z0-9._-]+/g, "_").slice(0, 120);
}

// ── Admin auth ───────────────────────────────────────────────────────────────

export const adminLoginFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ email: z.string().email().max(254), password: z.string().min(1).max(1024) }).parse(raw))
  .handler(async ({ data }) => {
    const { createAuthClient, setSessionCookies } = await import("./supabase");
    const env = await getEnv();
    await enforceRateLimit(env, "adminLogin", getRequestHeader("cf-connecting-ip") ?? "unknown");
    const client = await createAuthClient();
    const { data: signed, error } = await client.auth.signInWithPassword(data);
    if (error || !signed.session) return { ok: false as const, error: "Invalid staff credentials" };
    const verified = await client.auth.getUser(signed.session.access_token);
    const access = verified.data.user?.email_confirmed_at ? await readStaffAccess(client) : null;
    if (!access?.role) {
      await client.auth.signOut({ scope: "local" });
      return { ok: false as const, error: "Invalid staff credentials" };
    }
    await setSessionCookies(signed.session.access_token, signed.session.refresh_token, signed.session.expires_in);
    return { ok: true as const };
  });
export const adminSessionFn = createServerFn({ method: "GET" }).handler(async () => {
  const access = await getStaffAccess();
  return { valid: hasStaffAccess(access), role: access.role, mfaRequired: !!access.role && !access.mfa_verified };
});
export const adminLogoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const { revokeCurrentSession } = await import("./supabase");
  await revokeCurrentSession();
  return { ok: true };
});
export const staffMfaStatusFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getAuthenticatedSupabase } = await import("./supabase");
  const { client } = await getAuthenticatedSupabase();
  const access = await readStaffAccess(client);
  if (!access.role) throw new Error("Active staff membership required");
  const { data, error } = await client.auth.mfa.listFactors();
  if (error) throw new Error("Unable to load authentication factors");
  return { ...access, factors: data.totp.filter(f => f.status === "verified").map(f => ({ id: f.id, name: f.friendly_name ?? "Authenticator" })) };
});
export const staffMfaEnrollFn = createServerFn({ method: "POST" }).handler(async () => {
  const { getAuthenticatedSupabase } = await import("./supabase");
  const { client, user } = await getAuthenticatedSupabase();
  if (!(await readStaffAccess(client)).role) throw new Error("Active staff membership required");
  await enforceRateLimit(await getEnv(), "staffMfa", user.id);
  const factors = await client.auth.mfa.listFactors();
  if (factors.error) throw new Error("Unable to load authentication factors");
  if (factors.data.totp.some(f => f.status === "verified")) throw new Error("Use your existing authenticator. Contact the account owner if it is lost.");
  for (const factor of factors.data.all.filter(f => f.factor_type === "totp" && f.status === "unverified")) {
    const result = await client.auth.mfa.unenroll({ factorId: factor.id });
    if (result.error) throw new Error("Unable to restart authenticator setup");
  }
  const { data, error } = await client.auth.mfa.enroll({ factorType: "totp", friendlyName: "UKTL staff" });
  if (error) throw new Error("Unable to enroll authenticator");
  return { id: data.id, qrCode: data.totp.qr_code, secret: data.totp.secret };
});
export const staffMfaVerifyFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ factorId: z.string().uuid(), code: z.string().regex(/^\d{6}$/) }).parse(raw))
  .handler(async ({ data }) => {
    const { getAuthenticatedSupabase, setSessionCookies } = await import("./supabase");
    const { client, user } = await getAuthenticatedSupabase();
    if (!(await readStaffAccess(client)).role) throw new Error("Active staff membership required");
    await enforceRateLimit(await getEnv(), "staffMfa", user.id);
    const { data: challenge, error: challengeError } = await client.auth.mfa.challenge({ factorId: data.factorId });
    if (challengeError) throw new Error("Unable to challenge authenticator");
    const { data: session, error } = await client.auth.mfa.verify({ factorId: data.factorId, challengeId: challenge.id, code: data.code });
    if (error) throw new Error("Invalid or expired authentication code");
    await setSessionCookies(session.access_token, session.refresh_token, session.expires_in);
    const access = await readStaffAccess(client);
    if (!hasStaffAccess(access)) throw new Error("Staff access could not be verified");
    return { role: access.role };
  });

// ── Admin: FAQ topics ────────────────────────────────────────────────────────

export const adminListFaqFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  try {
    const env = await getEnv();
    return await listAllFaqTopics(env);
  } catch {
      throw new Error("Data is temporarily unavailable. Please try again.");
    }
});

export const adminGetFaqFn = createServerFn({ method: "GET" })
  .inputValidator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    await requireAdmin();
    try {
      const env = await getEnv();
      return await getFaqTopic(env, data.id);
    } catch {
      throw new Error("Data is temporarily unavailable. Please try again.");
    }
  });

export const adminCreateFaqFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({
      title: z.string().min(1),
      category: z.string().min(1),
      keywords: z.array(z.string()),
      sector_tag: z.string().nullable().optional(),
      video_url: z.string().nullable().optional(),
      thumbnail: z.string().nullable().optional(),
      duration_s: z.number().int().nullable().optional(),
      published: z.boolean().optional(),
    }).parse(raw),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const id = "faq_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const env = await getEnv();
    await createFaqTopic(env, id, data as FaqTopicInput);
    return { id };
  });

export const adminUpdateFaqFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({
      id: z.string(),
      title: z.string().min(1),
      category: z.string().min(1),
      keywords: z.array(z.string()),
      sector_tag: z.string().nullable().optional(),
      video_url: z.string().nullable().optional(),
      thumbnail: z.string().nullable().optional(),
      duration_s: z.number().int().nullable().optional(),
      published: z.boolean().optional(),
    }).parse(raw),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const { id, ...input } = data;
    const env = await getEnv();
    await updateFaqTopic(env, id, input as FaqTopicInput);
    return { ok: true };
  });

export const adminDeleteFaqFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    await requireAdmin();
    const env = await getEnv();
    await deleteFaqTopic(env, data.id);
    return { ok: true };
  });

// ── Admin: Jobs ──────────────────────────────────────────────────────────────

export const adminListJobsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  try {
    const env = await getEnv();
    return await listAllJobs(env);
  } catch {
      throw new Error("Data is temporarily unavailable. Please try again.");
    }
});

const JobInputSchema = z.object({
  title: z.string().min(1),
  company: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  sector: z.string().nullable().optional(),
  seniority: z.string().nullable().optional(),
  min_years_experience: z.number().int().nullable().optional(),
  description: z.string().nullable().optional(),
  must_have_skills: z.array(z.string()),
  nice_to_have_skills: z.array(z.string()),
  status: z.enum(["open", "closed"]),
});

export const adminCreateJobFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => JobInputSchema.parse(raw))
  .handler(async ({ data }) => {
    await requireAdmin();
    const id = "job_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const env = await getEnv();
    await createJob(env, id, data as JobInput);
    return { id };
  });

export const adminUpdateJobFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ id: z.string() }).merge(JobInputSchema).parse(raw))
  .handler(async ({ data }) => {
    await requireAdmin();
    const { id, ...input } = data;
    const env = await getEnv();
    await updateJob(env, id, input as JobInput);
    return { ok: true };
  });

export const adminDeleteJobFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    await requireAdmin();
    const env = await getEnv();
    await deleteJob(env, data.id);
    return { ok: true };
  });

// ── Admin: Candidates ────────────────────────────────────────────────────────

export const adminDeleteCandidateFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    await requireAdmin();
    const env = await getEnv();
    await deleteCandidate(env, data.id);
    return { ok: true };
  });

// ── Candidate Auth (Supabase) ─────────────────────────────────────────────────

export const candidateRegisterFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({
      email: z.string().email(),
      password: z.string().min(12).max(128),
      name: z.string().min(1),
    }).parse(raw),
  )
  .handler(async ({ data }) => {
    const { setSessionCookies } = await import("./supabase");
    const { createClient } = await import("@supabase/supabase-js");
    const env = await getEnv();
    await enforceRateLimit(env, "authAccount", getRequestHeader("cf-connecting-ip") ?? "unknown");
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) throw new Error("Supabase not configured");
    const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data: authData, error } = await client.auth.signUp({
      email: data.email,
      password: data.password,
      options: {
        data: { name: data.name },
        emailRedirectTo: env.SITE_URL ? authCallbackUrl(env) : undefined,
      },
    });
    if (error) throw new Error(error.message);
    if (authData.session) {
      await setSessionCookies(authData.session.access_token, authData.session.refresh_token, authData.session.expires_in);
    }
    return { userId: authData.user?.id ?? null, needsConfirmation: !authData.session };
  });

export const candidateLoginFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({ email: z.string().email(), password: z.string() }).parse(raw),
  )
  .handler(async ({ data }) => {
    const { setSessionCookies } = await import("./supabase");
    const { createClient } = await import("@supabase/supabase-js");
    const env = await getEnv();
    await enforceRateLimit(env, "authAccount", getRequestHeader("cf-connecting-ip") ?? "unknown");
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) throw new Error("Supabase not configured");
    const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data: authData, error } = await client.auth.signInWithPassword({ email: data.email, password: data.password });
    if (error) throw new Error(error.message);
    await setSessionCookies(authData.session.access_token, authData.session.refresh_token, authData.session.expires_in);
    return { userId: authData.user.id, email: authData.user.email };
  });

export const candidateLogoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const { revokeCurrentSession } = await import("./supabase");
  await revokeCurrentSession();
  return { ok: true };
});

export const getCandidateSessionFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getCandidateSession } = await import("./supabase");
  return await getCandidateSession();
});

export const candidateMagicLinkFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ email: z.string().email() }).parse(raw))
  .handler(async ({ data }) => {
    const { createClient } = await import("@supabase/supabase-js");
    const env = await getEnv();
    await enforceRateLimit(env, "authRecovery", getRequestHeader("cf-connecting-ip") ?? "unknown");
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) throw new Error("Supabase not configured");
    const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { error } = await client.auth.signInWithOtp({
      email: data.email,
      options: { shouldCreateUser: false, emailRedirectTo: authCallbackUrl(env) },
    });
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const candidateSessionFromTokensFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({
      access_token: z.string().min(1),
      refresh_token: z.string().min(1),
      expires_in: z.number().int().positive().optional(),
    }).parse(raw),
  )
  .handler(async ({ data }) => {
    const { setSessionCookies } = await import("./supabase");
    const { createClient } = await import("@supabase/supabase-js");
    const env = await getEnv();
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) throw new Error("Supabase not configured");
    const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data: authData, error } = await client.auth.setSession({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
    });
    if (error || !authData.session || !authData.user) {
      throw new Error(error?.message ?? "This sign-in link is invalid or has expired");
    }
    const verified = await client.auth.getUser(authData.session.access_token);
    if (verified.error || !verified.data.user) throw new Error("This sign-in link is invalid or has expired");
    await setSessionCookies(
      authData.session.access_token,
      authData.session.refresh_token,
      authData.session.expires_in,
    );
    return { userId: verified.data.user.id, email: verified.data.user.email ?? null };
  });

type ProfileRow = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  location: string | null;
  sector_preference: string | null;
  d1_candidate_id: string | null;
};

export const getCandidateProfileFn = createServerFn({ method: "GET" }).handler(async () => {
  const { getCandidateSession, getAuthenticatedSupabase } = await import("./supabase");
  const session = await getCandidateSession();
  if (!session.userId) return { profile: null, session: null };

  let profile: ProfileRow | null = null;
  try {
    const { client: admin } = await getAuthenticatedSupabase();
    const { data } = await admin.from("profiles").select("*").eq("id", session.userId).single();
    profile = (data as ProfileRow | null) ?? null;
  } catch { /* service role not configured */ }

  // candidates.auth_user_id is authoritative for the CV link; profiles.d1_candidate_id is a mirror.
  let d1CandidateId = profile?.d1_candidate_id ?? null;
  if (!d1CandidateId) {
    try {
      const env = await getEnv();
      d1CandidateId = await getLatestCandidateIdForUser(env, session.userId);
    } catch { /* preview */ }
  }

  const base: ProfileRow = profile ?? {
    id: session.userId,
    name: null,
    email: session.email,
    phone: null,
    location: null,
    sector_preference: null,
    d1_candidate_id: null,
  };
  return { profile: { ...base, d1_candidate_id: d1CandidateId }, session };
});

export const updateCandidateProfileFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({
      name: z.string().min(1),
      phone: z.string().nullable().optional(),
      location: z.string().nullable().optional(),
      sector_preference: z.enum(["construction", "technology", "both"]).nullable().optional(),
    }).parse(raw),
  )
  .handler(async ({ data }) => {
    const { getCandidateSession, getAuthenticatedSupabase } = await import("./supabase");
    const session = await getCandidateSession();
    if (!session.userId) throw new Error("Not authenticated");
    const { client: admin } = await getAuthenticatedSupabase();
    const { error } = await admin.from("profiles")
      .update(data)
      .eq("id", session.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ── Consultation Bookings ─────────────────────────────────────────────────────

export const createBookingFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({
      contact_name: z.string().min(1),
      contact_email: z.string().email(),
      contact_phone: z.string().nullable().optional(),
      topic_area: z.string().nullable().optional(),
      notes: z.string().nullable().optional(),
    }).parse(raw),
  )
  .handler(async ({ data }) => {
    const { getCandidateSession } = await import("./supabase");
    const session = await getCandidateSession();
    const env = await getEnv();
    await enforceRateLimit(env, "publicForm", getRequestHeader("cf-connecting-ip") ?? "unknown");
    const id = "booking_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    await createBooking(env, id, {
      ...data,
      auth_user_id: session.userId ?? undefined,
      user_email: session.email ?? undefined,
    });
    const notification = await deliverNotification(env, "bookings", id);
    return { id, notification };
  });

// ── Contact enquiries ────────────────────────────────────────────────────────

export const submitEnquiryFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({
      name: z.string().trim().min(1).max(200),
      email: z.string().trim().email().max(320),
      company: z.string().trim().max(200).optional(),
      enquiry_type: z.string().trim().max(100).optional(),
      message: z.string().trim().min(1).max(5000),
    }).parse(raw),
  )
  .handler(async ({ data }) => {
    const env = await getEnv();
    await enforceRateLimit(env, "publicForm", getRequestHeader("cf-connecting-ip") ?? "unknown");
    const id = "enq_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    await createEnquiry(env, id, {
      name: data.name,
      email: data.email,
      company: data.company || null,
      enquiry_type: data.enquiry_type || null,
      message: data.message,
    });
    const notification = await deliverNotification(env, "enquiries", id);
    return { id, notification };
  });

export const adminRetryNotificationFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ kind: z.enum(["enquiries", "bookings"]), id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    await requireAdmin();
    const env = await getEnv();
    await enforceRateLimit(env, "publicForm", "admin-notification-retry");
    return deliverNotification(env, data.kind, data.id);
  });

export const adminListEnquiriesFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  try {
    const env = await getEnv();
    return await listEnquiries(env);
  } catch {
      throw new Error("Data is temporarily unavailable. Please try again.");
    }
});

export const adminSetEnquiryStatusFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({ id: z.string(), status: z.enum(["new", "replied", "closed"]) }).parse(raw),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const env = await getEnv();
    if (!(await setEnquiryStatus(env, data.id, data.status))) throw new Error("Enquiry not found");
    return { ok: true as const };
  });

export const adminListBookingsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  try {
    const env = await getEnv();
    return await listBookings(env);
  } catch {
      throw new Error("Data is temporarily unavailable. Please try again.");
    }
});

// ── Admin: Analytics ─────────────────────────────────────────────────────────

export const adminGetAnalyticsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  try {
    const env = await getEnv();
    return await getAdminAnalytics(env);
  } catch {
    throw new Error("Analytics is temporarily unavailable. Please try again.");
  }
});

// ── Reed.co.uk Job Board Sync ─────────────────────────────────────────────────

export const syncReedJobsFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) =>
    z.object({
      keywords: z.string().default(""),
      sector: z.enum(["construction", "technology"]).default("construction"),
      resultsToTake: z.number().int().min(1).max(100).default(50),
    }).parse(raw),
  )
  .handler(async ({ data }) => {
    await requireAdmin();
    const env = await getEnv();
    await enforceRateLimit(env, "reedSync", "admin");
    return syncReedJobs(env, data);
  });


export const candidateResetRequestFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ email: z.string().email().max(254) }).parse(raw))
  .handler(async ({ data }) => {
    const { createAuthClient } = await import("./supabase");
    const env = await getEnv();
    await enforceRateLimit(env, "authRecovery", getRequestHeader("cf-connecting-ip") ?? "unknown");
    const client = await createAuthClient();
    const { error } = await client.auth.resetPasswordForEmail(data.email, { redirectTo: authCallbackUrl(env) });
    if (error) throw new Error("Recovery is temporarily unavailable. Please try again later.");
    return { ok: true };
  });
export const candidateSetPasswordFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ password: z.string().min(12).max(128) }).parse(raw))
  .handler(async ({ data }) => {
    const { getAuthenticatedSupabase, clearSessionCookies } = await import("./supabase");
    const { client, user } = await getAuthenticatedSupabase();
    await enforceRateLimit(await getEnv(), "authRecovery", user.id);
    const { error } = await client.auth.updateUser({ password: data.password });
    if (error) throw new Error("Password change failed. Use a new recovery link or complete MFA if required.");
    const revoked = await client.auth.signOut({ scope: "global" });
    await clearSessionCookies();
    if (revoked.error) throw new Error("Password changed, but session revocation failed. Please contact support.");
    return { ok: true };
  });
