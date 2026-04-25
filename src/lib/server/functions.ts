import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getEnv } from "./env";
import {
  getCandidate,
  getJob,
  getMatchesForCandidate,
  getMatchesForJob,
  insertCandidateShell,
  listCandidates,
  listJobs,
  markCandidateFailed,
  markCandidateParsing,
  upsertMatches,
  writeParsedProfile,
} from "./db";
import { parseCv } from "./parse";
import { scoreMatch } from "./match";
import { normaliseSkillList } from "./skills";
import { anonymiseProfile } from "./anonymize";
import { ParsedProfileSchema } from "../schemas/profile";
import {
  MOCK_CANDIDATES,
  MOCK_CANDIDATE_DETAILS,
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
