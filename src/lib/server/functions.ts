import { createServerFn } from "@tanstack/react-start";
import { getCookie, setCookie, deleteCookie } from "@tanstack/start-server-core";
import { z } from "zod";

import { getEnv } from "./env";
import {
  createFaqTopic,
  createJob,
  deleteCandidate,
  deleteFaqTopic,
  deleteJob,
  getCandidate,
  getFaqTopic,
  getJob,
  getMatchesForCandidate,
  getMatchesForJob,
  getSwipedJobIds,
  incrementFaqView,
  insertCandidateShell,
  listAllFaqTopics,
  listAllJobs,
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
} from "./db";
import {
  DEV_JWT_SECRET,
  SESSION_COOKIE,
  createSessionToken,
  verifyPassword,
  verifySessionToken,
} from "./auth";
import { parseCv } from "./parse";
import { scoreMatch } from "./match";
import { normaliseSkillList } from "./skills";
import { anonymiseProfile } from "./anonymize";
import { ParsedProfileSchema } from "../schemas/profile";
import {
  MOCK_CANDIDATES,
  MOCK_CANDIDATE_DETAILS,
  MOCK_FAQ_TOPICS,
  MOCK_JOBS,
  MOCK_MATCHES_BY_CANDIDATE,
  MOCK_MATCHES_BY_JOB,
} from "./mockData";

function isPreviewEnv(): boolean {
  try {
    // If we're in a browser or plain Node environment, Cloudflare bindings won't exist.
    return typeof (globalThis as Record<string, unknown>).caches === "undefined";
  } catch {
    return true;
  }
}

const ID_PREFIX = "cand_";
function newId(): string {
  return (
    ID_PREFIX +
    // eslint-disable-next-line no-undef
    crypto.randomUUID().replace(/-/g, "").slice(0, 20)
  );
}

export const listCandidatesFn = createServerFn({ method: "GET" }).handler(
  async () => {
    try {
      const env = await getEnv();
      return await listCandidates(env);
    } catch {
      return MOCK_CANDIDATES;
    }
  },
);

export const getCandidateDetailFn = createServerFn({ method: "GET" })
  .validator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    try {
      const env = await getEnv();
      const candidate = await getCandidate(env, data.id);
      if (!candidate) return null;
      const matches = await getMatchesForCandidate(env, data.id);
      return { candidate, matches };
    } catch {
      const candidate = MOCK_CANDIDATE_DETAILS[data.id] ?? null;
      if (!candidate) return null;
      const matches = MOCK_MATCHES_BY_CANDIDATE[data.id] ?? [];
      return { candidate, matches };
    }
  });

export const getAnonymisedCandidateFn = createServerFn({ method: "GET" })
  .validator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    try {
      const env = await getEnv();
      const row = await getCandidate(env, data.id);
      if (!row?.source_r2_key) return null;
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
      const detail = MOCK_CANDIDATE_DETAILS[data.id];
      if (!detail) return null;
      // Build a minimal ParsedProfile from mock detail for anonymisation preview
      const profile = ParsedProfileSchema.parse({
        name: detail.name,
        email: detail.email,
        phone: detail.phone,
        location: detail.location,
        headline: detail.headline,
        summary: detail.summary,
        seniority: detail.seniority,
        total_years_experience: detail.total_years_experience,
        work_authorization: detail.work_authorization,
        skills: detail.skills.map((s) => ({ skill: s.skill })),
        experience: detail.experience,
        education: detail.education,
        links: detail.links,
      });
      return anonymiseProfile(profile);
    }
  });

export const listJobsFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const env = await getEnv();
    return await listJobs(env);
  } catch {
    return MOCK_JOBS;
  }
});

export const getJobDetailFn = createServerFn({ method: "GET" })
  .validator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    try {
      const env = await getEnv();
      const job = await getJob(env, data.id);
      if (!job) return null;
      const matches = await getMatchesForJob(env, data.id);
      return { job, matches };
    } catch {
      const job = MOCK_JOBS.find((j) => j.id === data.id) ?? null;
      if (!job) return null;
      const matches = MOCK_MATCHES_BY_JOB[data.id] ?? [];
      return { job, matches };
    }
  });

// Core automation entry-point.
// Flow: receive file → write to R2 → insert candidate shell → parse via LLM →
// persist structured profile + skills + experience → score against every open
// job → persist matches. Client-facing effect: after one upload the candidate
// is searchable, ranked, and shortlistable with zero consultant effort.
export const uploadAndParseCvFn = createServerFn({ method: "POST" })
  .validator((raw: unknown): FormData => {
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
    const allowedTypes = ["application/pdf", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/msword", "text/plain", ""];
    const ext = file.name.toLowerCase();
    if (!allowedTypes.includes(file.type) && !ext.match(/\.(pdf|docx|doc|txt)$/)) {
      throw new Error("Unsupported file type — upload PDF, DOCX, or TXT");
    }
    let env: Awaited<ReturnType<typeof getEnv>>;
    try {
      env = await getEnv();
    } catch {
      // Preview mode: simulate a successful parse with mock data
      return {
        id: "cand_preview_001",
        status: "parsed" as const,
        quality: { score: 87, notes: ["Preview mode — connect Cloudflare D1 + R2 to parse real CVs."] },
        preview: true,
      };
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
    });
    await markCandidateParsing(env, id);

    try {
      const isPdf =
        file.type === "application/pdf" ||
        file.name.toLowerCase().endsWith(".pdf");
      const parseInput = isPdf
        ? ({ kind: "pdf", bytes, filename: file.name } as const)
        : ({
            kind: "text",
            text: new TextDecoder().decode(bytes),
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
  .validator((raw: unknown) =>
    z.object({ candidateId: z.string().optional() }).parse(raw),
  )
  .handler(async ({ data }) => {
    try {
      const env = await getEnv();
      const allJobs = await listJobs(env);
      let unseenJobs = allJobs;
      const matchMap: Record<string, number> = {};

      if (data.candidateId) {
        const swipedIds = new Set(await getSwipedJobIds(env, data.candidateId));
        unseenJobs = allJobs.filter((j) => !swipedIds.has(j.id));
        const candidateMatches = await getMatchesForCandidate(env, data.candidateId);
        candidateMatches.forEach((m) => {
          matchMap[m.job_id] = m.score;
        });
      }

      return { jobs: unseenJobs, matches: matchMap };
    } catch {
      const deterministicScore = (id: string) => {
        let n = 0;
        for (let i = 0; i < id.length; i++) n = (n * 31 + id.charCodeAt(i)) & 0xffffff;
        return 50 + (n % 40);
      };
      return {
        jobs: MOCK_JOBS,
        matches: Object.fromEntries(MOCK_JOBS.map((j) => [j.id, deterministicScore(j.id)])),
      };
    }
  });

export const recordSwipeFn = createServerFn({ method: "POST" })
  .validator((raw: unknown) =>
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
  .validator((raw: unknown) =>
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
      topics = MOCK_FAQ_TOPICS;
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
  .validator((raw: unknown) =>
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
      let topics = MOCK_FAQ_TOPICS;
      if (data.category) topics = topics.filter((t) => t.category === data.category);
      if (data.sector) topics = topics.filter((t) => !t.sector_tag || t.sector_tag === data.sector);
      return topics;
    }
  });

export const recordFaqViewFn = createServerFn({ method: "POST" })
  .validator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
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
  .validator((raw: unknown) =>
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
  .validator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    const env = await getEnv();
    const detail = await getCandidate(env, data.id);
    if (!detail) throw new Error("Candidate not found");
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
  .validator((raw: unknown) => z.object({ password: z.string() }).parse(raw))
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

export const adminSessionFn = createServerFn({ method: "GET" }).handler(async () => {
  const token = getCookie(SESSION_COOKIE);
  if (!token) return { valid: false };
  let secret = DEV_JWT_SECRET;
  try { const env = await getEnv(); secret = getJwtSecret(env); } catch { /* preview */ }
  const valid = await verifySessionToken(token, secret);
  return { valid };
});

export const adminLogoutFn = createServerFn({ method: "POST" }).handler(async () => {
  deleteCookie(SESSION_COOKIE, { path: "/" });
  return { ok: true };
});

// ── Admin: FAQ topics ────────────────────────────────────────────────────────

export const adminListFaqFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const env = await getEnv();
    return await listAllFaqTopics(env);
  } catch {
    return MOCK_FAQ_TOPICS;
  }
});

export const adminGetFaqFn = createServerFn({ method: "GET" })
  .validator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    try {
      const env = await getEnv();
      return await getFaqTopic(env, data.id);
    } catch {
      return MOCK_FAQ_TOPICS.find((t) => t.id === data.id) ?? null;
    }
  });

export const adminCreateFaqFn = createServerFn({ method: "POST" })
  .validator((raw: unknown) =>
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
    const id = "faq_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const env = await getEnv();
    await createFaqTopic(env, id, data as FaqTopicInput);
    return { id };
  });

export const adminUpdateFaqFn = createServerFn({ method: "POST" })
  .validator((raw: unknown) =>
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
    const { id, ...input } = data;
    const env = await getEnv();
    await updateFaqTopic(env, id, input as FaqTopicInput);
    return { ok: true };
  });

export const adminDeleteFaqFn = createServerFn({ method: "POST" })
  .validator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    const env = await getEnv();
    await deleteFaqTopic(env, data.id);
    return { ok: true };
  });

// ── Admin: Jobs ──────────────────────────────────────────────────────────────

export const adminListJobsFn = createServerFn({ method: "GET" }).handler(async () => {
  try {
    const env = await getEnv();
    return await listAllJobs(env);
  } catch {
    return MOCK_JOBS;
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
  .validator((raw: unknown) => JobInputSchema.parse(raw))
  .handler(async ({ data }) => {
    const id = "job_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
    const env = await getEnv();
    await createJob(env, id, data as JobInput);
    return { id };
  });

export const adminUpdateJobFn = createServerFn({ method: "POST" })
  .validator((raw: unknown) => z.object({ id: z.string() }).merge(JobInputSchema).parse(raw))
  .handler(async ({ data }) => {
    const { id, ...input } = data;
    const env = await getEnv();
    await updateJob(env, id, input as JobInput);
    return { ok: true };
  });

export const adminDeleteJobFn = createServerFn({ method: "POST" })
  .validator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    const env = await getEnv();
    await deleteJob(env, data.id);
    return { ok: true };
  });

// ── Admin: Candidates ────────────────────────────────────────────────────────

export const adminDeleteCandidateFn = createServerFn({ method: "POST" })
  .validator((raw: unknown) => z.object({ id: z.string() }).parse(raw))
  .handler(async ({ data }) => {
    const env = await getEnv();
    await deleteCandidate(env, data.id);
    return { ok: true };
  });
