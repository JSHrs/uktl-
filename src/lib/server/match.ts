import type { Job, Match, MatchScore } from "../schemas/job";
import type { ParsedProfile, Seniority } from "../schemas/profile";
import { normaliseSkill } from "./skills";

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
  const mustHave = job.must_have_skills.map(normaliseSkill);
  const niceHave = job.nice_to_have_skills.map(normaliseSkill);

  const candSet = new Set(candidateSkills);
  const matchedMust = mustHave.filter((s) => candSet.has(s));
  const matchedNice = niceHave.filter((s) => candSet.has(s));
  const missingMust = mustHave.filter((s) => !candSet.has(s));

  const mustScore =
    mustHave.length === 0 ? 100 : (matchedMust.length / mustHave.length) * 100;
  const niceScore =
    niceHave.length === 0 ? 0 : (matchedNice.length / niceHave.length) * 100;
  // Must-haves dominate; nice-haves top up.
  const skills_overlap = Math.round(mustScore * 0.8 + niceScore * 0.2);

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
  if (min == null) return 75;
  if (cand == null) return 40;
  if (cand >= min) {
    // diminishing bonus above the bar; cap the cost of being dramatically overqualified
    const over = cand - min;
    const bonus = Math.max(0, 20 - Math.abs(over - 3) * 2);
    return Math.min(100, 80 + bonus);
  }
  // below bar: linear penalty
  const gap = min - cand;
  return Math.max(10, Math.round(80 - gap * 15));
}

function scoreSeniority(cand: Seniority | null, job: Seniority | null): number {
  if (!job) return 75;
  if (!cand) return 40;
  const ci = SENIORITY_ORDER.indexOf(cand);
  const ji = SENIORITY_ORDER.indexOf(job);
  if (ci === -1 || ji === -1) return 50;
  const gap = Math.abs(ci - ji);
  if (gap === 0) return 100;
  if (gap === 1) return 75;
  if (gap === 2) return 50;
  return 25;
}

function scoreLocation(cand: string | null, job: string | null): number {
  if (!job) return 70;
  if (!cand) return 50;
  const c = cand.toLowerCase();
  const j = job.toLowerCase();
  if (c.includes(j) || j.includes(c)) return 100;
  const regions: Array<[string, string[]]> = [
    ["uk", ["london", "uk", "england", "manchester", "edinburgh"]],
    ["uae", ["dubai", "abu dhabi", "uae"]],
    ["ksa", ["riyadh", "jeddah", "saudi", "ksa"]],
    ["qatar", ["doha", "qatar"]],
    ["bahrain", ["manama", "bahrain"]],
  ];
  for (const [, tokens] of regions) {
    const inC = tokens.some((t) => c.includes(t));
    const inJ = tokens.some((t) => j.includes(t));
    if (inC && inJ) return 90;
  }
  return 30;
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
  const parts: string[] = [];
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
