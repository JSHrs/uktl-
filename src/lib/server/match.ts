import type { Job, MatchScore } from "../schemas/job";
import type { ParsedProfile, Seniority } from "../schemas/profile";
import { normaliseSkill } from "./skills.ts";

const SENIORITY_ORDER: Seniority[] = [
  "junior",
  "mid",
  "senior",
  "lead",
  "director",
  "executive",
];

// Composite match score. Weights chosen for exec/senior search where
// "has the must-haves" and "right seniority" matter more than location.
const WEIGHTS = {
  skills: 0.5,
  experience: 0.2,
  seniority: 0.2,
  location: 0.1,
};

export function scoreMatch(
  candidate: ParsedProfile,
  candidateSkills: string[], // already normalised
  job: Job,
): MatchScore & {
  matched_skills: string[];
  missing_skills: string[];
} {
  const mustHave = [...new Set(job.must_have_skills.map(normaliseSkill).filter(Boolean))];
  const niceHave = [...new Set(job.nice_to_have_skills.map(normaliseSkill).filter(Boolean))].filter(s=>!mustHave.includes(s));

  const candSet = new Set(candidateSkills.map(normaliseSkill).filter(Boolean));
  const matchedMust = mustHave.filter((s) => candSet.has(s));
  const matchedNice = niceHave.filter((s) => candSet.has(s));
  const missingMust = mustHave.filter((s) => !candSet.has(s));

  const mustScore =
    mustHave.length === 0 ? 0 : (matchedMust.length / mustHave.length) * 100;
  const niceScore =
    niceHave.length === 0 ? 0 : (matchedNice.length / niceHave.length) * 100;
  // Must-haves dominate; nice-haves top up.
  const skills_overlap = Math.round(mustHave.length ? (niceHave.length ? mustScore * 0.8 + niceScore * 0.2 : mustScore) : niceScore * 0.2);

  const experience_fit = scoreExperience(
    candidate.total_years_experience ?? null,
    job.min_years_experience ?? null,
  );
  const seniority_fit = scoreSeniority(
    candidate.seniority ?? null,
    job.seniority ?? null,
  );
  const location_fit = scoreLocation(
    candidate.location ?? null,
    job.location ?? null,
  );

  const score = Math.round(
    skills_overlap * WEIGHTS.skills +
      experience_fit * WEIGHTS.experience +
      seniority_fit * WEIGHTS.seniority +
      location_fit * WEIGHTS.location,
  );

  const reasoning = buildReasoning({
    matchedMust,
    matchedNice,
    missingMust,
    experience_fit,
    seniority_fit,
    location_fit,
    candidate,
    job,
  });

  return {
    job_id: job.id,
    score,
    skills_overlap,
    experience_fit,
    seniority_fit,
    location_fit,
    matched_skills: [...matchedMust, ...matchedNice],
    missing_skills: missingMust,
    reasoning,
  };
}

function scoreExperience(cand: number | null, min: number | null): number {
  if (min == null || cand == null || !Number.isFinite(min) || !Number.isFinite(cand) || min < 0 || cand < 0) return 0;
  // Meeting the requirement is sufficient; excess years do not earn extra credit.
  if (min === 0 || cand >= min) return 100;
  return Math.round((cand / min) * 100);
}

function scoreSeniority(cand: Seniority | null, job: Seniority | null): number {
  if (!job) return 0;
  if (!cand) return 0;
  const ci = SENIORITY_ORDER.indexOf(cand);
  const ji = SENIORITY_ORDER.indexOf(job);
  if (ci === -1 || ji === -1) return 0;
  const gap = Math.abs(ci - ji);
  if (gap === 0) return 100;
  if (gap === 1) return 75;
  if (gap === 2) return 50;
  return 25;
}

function scoreLocation(cand: string | null, job: string | null): number {
  const normalise = (value: string) => value.toLowerCase().trim().replace(/\s+/g," ");
  if (!job?.trim()) return 0;
  const j = normalise(job);
  if (j === "remote" || j === "fully remote") return 100;
  if (!cand?.trim()) return 0;
  const c = normalise(cand);
  if (c === j) return 100;
  // Compare explicit city names, never substrings (York is not New York).
  const city = (value: string) => value.split(",")[0].trim();
  if (city(c) === city(j)) return 100;
  return 0;
}

function buildReasoning(ctx: {
  matchedMust: string[];
  matchedNice: string[];
  missingMust: string[];
  experience_fit: number;
  seniority_fit: number;
  location_fit: number;
  candidate: ParsedProfile;
  job: Job;
}): string {
  const parts: string[] = ["Rules-based evidence score; requires human review."];
  const unknown: string[] = [];
  if (!ctx.job.must_have_skills.some(s=>normaliseSkill(s))) unknown.push("essential job skills");
  if (ctx.job.min_years_experience == null || ctx.candidate.total_years_experience == null) unknown.push("experience comparison");
  if (!ctx.job.seniority || !ctx.candidate.seniority) unknown.push("seniority comparison");
  if (!ctx.job.location?.trim() || (!ctx.candidate.location?.trim() && !/^(fully )?remote$/i.test(ctx.job.location.trim()))) unknown.push("location comparison");
  if (unknown.length) parts.push(`Not established: ${unknown.join(", ")}. Missing information earns no points and must not be treated as a rejection.`);
  if (ctx.matchedMust.length) {
    parts.push(`Matches must-haves: ${ctx.matchedMust.join(", ")}.`);
  }
  if (ctx.missingMust.length) {
    parts.push(`Gaps on must-haves: ${ctx.missingMust.join(", ")}.`);
  }
  if (ctx.matchedNice.length) {
    parts.push(`Nice-to-haves present: ${ctx.matchedNice.join(", ")}.`);
  }
  if (ctx.job.min_years_experience != null) {
    parts.push(
      `Experience fit ${ctx.experience_fit}/100 (candidate ${
        ctx.candidate.total_years_experience ?? "?"
      } vs required ${ctx.job.min_years_experience} yrs).`,
    );
  }
  if (ctx.job.seniority) {
    parts.push(
      `Seniority fit ${ctx.seniority_fit}/100 (${
        ctx.candidate.seniority ?? "unknown"
      } vs ${ctx.job.seniority}).`,
    );
  }
  if (ctx.job.location) {
    parts.push(`Location fit ${ctx.location_fit}/100.`);
  }
  return parts.join(" ");
}
