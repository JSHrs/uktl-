import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/start-server-core";
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
  listFaqTopics,
  listJobs,
  markCandidateFailed,
  markCandidateParsing,
  recordSwipe,
  updateFaqTopic,
  updateJob,
  upsertMatches,
  writeParsedProfile,
  type FaqTopic,
  type FaqTopicInput,
  type JobInput,
} from "./server/db";
import {
  DEV_JWT_SECRET,
  SESSION_COOKIE,
  createSessionToken,
  verifyPassword,
  verifySessionToken,
} from "./server/auth";
import { parseCv } from "./server/parse";
import { scoreMatch } from "./server/match";
import { normaliseSkillList } from "./server/skills";
import { anonymiseProfile } from "./server/anonymize";
import { extractDocxText } from "./server/docx";
import { ParsedProfileSchema } from "./schemas/profile";

const ID_PREFIX = "cand_";
function newId(): string {
  return (
    ID_PREFIX +
    crypto.randomUUID().replace(/-/g, "").slice(0, 20)
  );
}

const DOCX_MIME = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";

// ── Request auth helpers ─────────────────────────────────────────────────────

async function isAdminRequest(): Promise<boolean> {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return false;
  let secret = DEV_JWT_SECRET;
  try { const env = await getEnv(); secret = getJwtSecret(env); } catch { /* preview */ }
  return verifySessionToken(token, secret);
}

async function requireAdmin(): Promise<void> {
  if (!(await isAdminRequest())) throw new Error("Unauthorized — admin session required");
}

type Viewer = { isAdmin: boolean; userId: string | null };

async function getViewer(): Promise<Viewer> {
  const { getCandidateSession } = await import("./supabase");
  const [isAdmin, session] = await Promise.all([isAdminRequest(), getCandidateSession()]);
  return { isAdmin, userId: session.userId };
}

function canAccessCandidate(viewer: Viewer, ownerId: string | null | undefined): boolean {
  if (viewer.isAdmin) return true;
  return !!viewer.userId && ownerId === viewer.userId;
}

function authCallbackUrl(env: { SITE_URL?: string }): string {
  if (!env.SITE_URL) throw new Error("SITE_URL not configured");
  return `${env.SITE_URL.replace(/\/+$/, "")}/auth/callback`;
}

export const getViewerFn = createServerFn({ method: "GET" }).handler(async () => getViewer());

export const listCandidatesFn = createServerFn({ method: "GET" }).handler(
  async () => {
    const viewer = await getViewer();
    const scope = viewer.isAdmin ? {} : viewer.userId ? { authUserId: viewer.userId } : null;
    if (!scope) return [];
    try {
      const env = await getEnv();
      return await listCandidates(env, scope);
    } catch {
      return [];
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
      return null;
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
      return null;
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
    try {
      const env = await getEnv();
      const job = await getJob(env, data.id);
      if (!job) return null;
      const matches = await getMatchesForJob(env, data.id);
      return { job, matches };
    } catch {
      return null;
    }
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
      throw new Error("CV processing is unavailable here — Cloudflare D1 and R2 bindings are not configured");
    }
    const bytes = await file.arrayBuffer();
    const id = newId();
    const r2Key = `cvs/${id}/${sanitiseFilename(file.name)}`;

    await env.CV_BUCKET.put(r2Key, bytes, {
      httpMetadata: { contentType: file.type || "application/octet-stream" },
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
      const isPdf = file.type === "application/pdf" || lower.endsWith(".pdf");
      const isDocx = file.type === DOCX_MIME || lower.endsWith(".docx");
      const parseInput = isPdf
        ? ({ kind: "pdf", bytes, filename: file.name } as const)
        : ({
            kind: "text",
            text: isDocx ? extractDocxText(bytes) : new TextDecoder().decode(bytes),
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
      question: z.string(),
      category: z.string().optional(),
      additionalContext: z.string().optional(),
    }).parse(raw),
  )
  .handler(async ({ data }) => {
    let apiKey: string | undefined;
    try {
      const env = await getEnv();
      apiKey = env.ANTHROPIC_API_KEY;
    } catch {
      apiKey = undefined;
    }

    if (!apiKey) {
      return {
        response:
          "This is a placeholder AI response (Anthropic API key not configured in this environment).\n\n" +
          "In production, Claude would provide detailed ACAS-grounded guidance on your question. " +
          "The response would reference relevant UK employment legislation and explain your rights clearly.\n\n" +
          "This information is for general guidance only and does not constitute legal advice. " +
          "For your specific situation, speaking with a qualified employment lawyer is recommended.",
        source: "mock",
      };
    }

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

function getJwtSecret(env: { JWT_SECRET?: string }): string {
  return env.JWT_SECRET ?? DEV_JWT_SECRET;
}

export const adminLoginFn = createServerFn({ method: "POST" })
  .inputValidator((raw: unknown) => z.object({ password: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    let hash: string | undefined;
    let secret = DEV_JWT_SECRET;
    try {
      const env = await getEnv();
      hash = env.ADMIN_PASSWORD_HASH;
      secret = getJwtSecret(env);
    } catch { /* preview mode */ }
    const valid = await verifyPassword(data.password, hash);
    if (!valid) return { ok: false as const, error: "Invalid password" };
    const token = await createSessionToken(secret);
    setCookie(SESSION_COOKIE, token, { httpOnly: true, sameSite: "strict", maxAge: 8 * 3600, path: "/" });
    return { ok: true as const };
  });

export const adminSessionFn = createServerFn({ method: "GET" }).handler(async () => ({
  valid: await isAdminRequest(),
}));

export const adminLogoutFn = createServerFn({ method: "POST" }).handler(async () => {
  deleteCookie(SESSION_COOKIE, { path: "/" });
  return { ok: true };
});

// ── Admin: FAQ topics ────────────────────────────────────────────────────────

export const adminListFaqFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  try {
    const env = await getEnv();
    return await listAllFaqTopics(env);
  } catch {
    return [];
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
      return null;
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
    return [];
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
      password: z.string().min(8),
      name: z.string().min(1),
    }).parse(raw),
  )
  .handler(async ({ data }) => {
    const { setSessionCookies } = await import("./supabase");
    const { createClient } = await import("@supabase/supabase-js");
    const env = await getEnv();
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
    if (!env.SUPABASE_URL || !env.SUPABASE_ANON_KEY) throw new Error("Supabase not configured");
    const client = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, { auth: { persistSession: false } });
    const { data: authData, error } = await client.auth.signInWithPassword({ email: data.email, password: data.password });
    if (error) throw new Error(error.message);
    await setSessionCookies(authData.session.access_token, authData.session.refresh_token, authData.session.expires_in);
    return { userId: authData.user.id, email: authData.user.email };
  });

export const candidateLogoutFn = createServerFn({ method: "POST" }).handler(async () => {
  const { clearSessionCookies } = await import("./supabase");
  await clearSessionCookies();
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
    await setSessionCookies(
      authData.session.access_token,
      authData.session.refresh_token,
      authData.session.expires_in ?? data.expires_in ?? 3600,
    );
    return { userId: authData.user.id, email: authData.user.email ?? null };
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
  const { getCandidateSession, getSupabaseAdmin } = await import("./supabase");
  const session = await getCandidateSession();
  if (!session.userId) return { profile: null, session: null };

  let profile: ProfileRow | null = null;
  try {
    const admin = await getSupabaseAdmin();
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
    const { getCandidateSession, getSupabaseAdmin } = await import("./supabase");
    const session = await getCandidateSession();
    if (!session.userId) throw new Error("Not authenticated");
    const admin = await getSupabaseAdmin();
    const { error } = await admin.from("profiles")
      .update({ ...data, updated_at: new Date().toISOString() })
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
    const id = "booking_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    await createBooking(env, id, {
      ...data,
      auth_user_id: session.userId ?? undefined,
      user_email: session.email ?? undefined,
    });
    // Notify admin via Resend if configured
    if (env.RESEND_API_KEY) {
      await sendBookingNotification(env.RESEND_API_KEY, data).catch(() => {});
    }
    return { id };
  });

async function sendBookingNotification(
  resendKey: string,
  booking: { contact_name: string; contact_email: string; topic_area?: string | null },
): Promise<void> {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "noreply@uktalentlink.co.uk",
      to: ["info@uktalentlink.co.uk"],
      subject: `New consultation booking — ${booking.contact_name}`,
      text: `New consultation booking received.\n\nName: ${booking.contact_name}\nEmail: ${booking.contact_email}\nTopic: ${booking.topic_area ?? "Not specified"}\n`,
    }),
  });
}

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
    const id = "enq_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    await createEnquiry(env, id, {
      name: data.name,
      email: data.email,
      company: data.company || null,
      enquiry_type: data.enquiry_type || null,
      message: data.message,
    });
    if (env.RESEND_API_KEY) {
      await sendEnquiryNotification(env.RESEND_API_KEY, data).catch(() => {});
    }
    return { id };
  });

async function sendEnquiryNotification(
  resendKey: string,
  e: { name: string; email: string; company?: string; enquiry_type?: string; message: string },
): Promise<void> {
  await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${resendKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: "noreply@uktalentlink.co.uk",
      to: ["info@uktalentlink.co.uk"],
      reply_to: e.email,
      subject: `New enquiry — ${e.name}${e.enquiry_type ? ` (${e.enquiry_type})` : ""}`,
      text:
        `Name: ${e.name}\nEmail: ${e.email}\nCompany: ${e.company || "—"}\n` +
        `Type: ${e.enquiry_type || "—"}\n\n${e.message}\n`,
    }),
  });
}

export const adminListBookingsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  try {
    const env = await getEnv();
    return await listBookings(env);
  } catch {
    return [];
  }
});

// ── Admin: Analytics ─────────────────────────────────────────────────────────

export const adminGetAnalyticsFn = createServerFn({ method: "GET" }).handler(async () => {
  await requireAdmin();
  try {
    const env = await getEnv();
    return await getAdminAnalytics(env);
  } catch {
    return {
      total_candidates: 0, parsed_candidates: 0, avg_quality_score: null,
      total_jobs: 0, open_jobs: 0, total_faq_views: 0,
      total_queries: 0, resolved_queries: 0, total_bookings: 0,
    };
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
    if (!env.REED_API_KEY) throw new Error("REED_API_KEY not configured");

    // Reed API uses HTTP Basic Auth: API key as username, password blank
    const auth = btoa(`${env.REED_API_KEY}:`);
    const params = new URLSearchParams({
      keywords: data.keywords || (data.sector === "construction" ? "construction engineering" : "software technology"),
      locationName: "United Kingdom",
      resultsToTake: String(data.resultsToTake),
      fullTime: "true",
    });

    const res = await fetch(`https://www.reed.co.uk/api/1.0/search?${params}`, {
      headers: { Authorization: `Basic ${auth}`, Accept: "application/json" },
    });
    if (!res.ok) throw new Error(`Reed API error: ${res.status}`);

    const body = (await res.json()) as { results?: ReedJob[] };
    const reedJobs = body.results ?? [];

    let inserted = 0;
    let skipped = 0;

    for (const rj of reedJobs) {
      const existing = await env.DB.prepare(`SELECT id FROM jobs WHERE source_id=?`)
        .bind(String(rj.jobId))
        .first<{ id: string }>();
      if (existing) { skipped++; continue; }

      const id = "job_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
      const now = Date.now();
      await env.DB.prepare(
        `INSERT INTO jobs (id, created_at, title, company, location, sector, description, must_have_skills, nice_to_have_skills, status, source, source_id, source_url, posted_date, expiry_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', 'reed', ?, ?, ?, ?)`,
      ).bind(
        id, now,
        rj.jobTitle, rj.employerName ?? null,
        rj.locationName ?? null, data.sector,
        rj.jobDescription ?? null,
        JSON.stringify([]), JSON.stringify([]),
        String(rj.jobId),
        rj.jobUrl ?? null,
        rj.date ?? null,
        rj.expirationDate ?? null,
      ).run().catch(() => { skipped++; });
      inserted++;
    }

    return { inserted, skipped, total: reedJobs.length };
  });

type ReedJob = {
  jobId: number;
  jobTitle: string;
  employerName?: string;
  locationName?: string;
  jobDescription?: string;
  jobUrl?: string;
  date?: string;
  expirationDate?: string;
};
