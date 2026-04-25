import type { AppEnv } from "./env";
import type { ParsedProfile, QualityAssessment } from "../schemas/profile";
import { JobSchema, type Job, type Match } from "../schemas/job";

export type CandidateRow = {
  id: string;
  created_at: number;
  updated_at: number;
  status: string;
  source_filename: string | null;
  source_r2_key: string | null;
  name: string | null;
  email: string | null;
  location: string | null;
  headline: string | null;
  seniority: string | null;
  total_years_experience: number | null;
  quality_score: number | null;
};

export type CandidateDetail = CandidateRow & {
  phone: string | null;
  summary: string | null;
  work_authorization: string | null;
  quality_notes: string[];
  links: Record<string, string | null>;
  skills: Array<{ skill: string; skill_raw: string; years_experience: number | null }>;
  experience: Array<{
    company: string | null;
    title: string | null;
    start_date: string | null;
    end_date: string | null;
    is_current: boolean;
    location: string | null;
    description: string | null;
  }>;
  education: Array<{
    institution: string | null;
    degree: string | null;
    field: string | null;
    start_year: string | null;
    end_year: string | null;
  }>;
  parse_error: string | null;
};

export async function insertCandidateShell(
  env: AppEnv,
  args: { id: string; filename: string; r2Key: string; sizeBytes: number },
): Promise<void> {
  const now = Date.now();
  await env.DB.prepare(
    `INSERT INTO candidates
      (id, created_at, updated_at, status, source_filename, source_r2_key, source_bytes)
     VALUES (?, ?, ?, 'uploaded', ?, ?, ?)`,
  )
    .bind(args.id, now, now, args.filename, args.r2Key, args.sizeBytes)
    .run();
}

export async function markCandidateParsing(env: AppEnv, id: string): Promise<void> {
  await env.DB.prepare(
    `UPDATE candidates SET status='parsing', updated_at=? WHERE id=?`,
  )
    .bind(Date.now(), id)
    .run();
}

export async function markCandidateFailed(
  env: AppEnv,
  id: string,
  error: string,
): Promise<void> {
  await env.DB.prepare(
    `UPDATE candidates SET status='failed', parse_error=?, updated_at=? WHERE id=?`,
  )
    .bind(error.slice(0, 2000), Date.now(), id)
    .run();
}

export async function writeParsedProfile(
  env: AppEnv,
  id: string,
  profile: ParsedProfile,
  normalisedSkills: string[],
  quality: QualityAssessment,
): Promise<void> {
  const now = Date.now();
  const statements: D1PreparedStatement[] = [];

  statements.push(
    env.DB.prepare(
      `UPDATE candidates SET
        status='parsed',
        updated_at=?,
        name=?, email=?, phone=?, location=?, headline=?, summary=?,
        total_years_experience=?, seniority=?, work_authorization=?,
        quality_score=?, quality_notes=?, links=?, raw_profile=?, parse_error=NULL
       WHERE id=?`,
    ).bind(
      now,
      profile.name ?? null,
      profile.email ?? null,
      profile.phone ?? null,
      profile.location ?? null,
      profile.headline ?? null,
      profile.summary ?? null,
      profile.total_years_experience ?? null,
      profile.seniority ?? null,
      profile.work_authorization ?? null,
      quality.score,
      JSON.stringify(quality.notes),
      JSON.stringify(profile.links ?? {}),
      JSON.stringify(profile),
      id,
    ),
  );

  statements.push(
    env.DB.prepare(`DELETE FROM candidate_skills WHERE candidate_id=?`).bind(id),
  );
  statements.push(
    env.DB.prepare(`DELETE FROM candidate_experience WHERE candidate_id=?`).bind(id),
  );
  statements.push(
    env.DB.prepare(`DELETE FROM candidate_education WHERE candidate_id=?`).bind(id),
  );

  const skillsPaired = (profile.skills ?? []).map((s, i) => ({
    raw: s.skill,
    normal: normalisedSkills[i] ?? s.skill.toLowerCase(),
    yoe: s.years_experience ?? null,
  }));
  const seen = new Set<string>();
  for (const s of skillsPaired) {
    if (!s.normal || seen.has(s.normal)) continue;
    seen.add(s.normal);
    statements.push(
      env.DB.prepare(
        `INSERT INTO candidate_skills (candidate_id, skill, skill_raw, years_experience)
         VALUES (?, ?, ?, ?)`,
      ).bind(id, s.normal, s.raw, s.yoe),
    );
  }

  (profile.experience ?? []).forEach((exp, i) => {
    statements.push(
      env.DB.prepare(
        `INSERT INTO candidate_experience
          (id, candidate_id, company, title, start_date, end_date, is_current,
           location, description, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        `${id}_exp_${i}`,
        id,
        exp.company ?? null,
        exp.title ?? null,
        exp.start_date ?? null,
        exp.end_date ?? null,
        exp.is_current ? 1 : 0,
        exp.location ?? null,
        exp.description ?? null,
        i,
      ),
    );
  });

  (profile.education ?? []).forEach((ed, i) => {
    statements.push(
      env.DB.prepare(
        `INSERT INTO candidate_education
          (id, candidate_id, institution, degree, field, start_year, end_year)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
      ).bind(
        `${id}_edu_${i}`,
        id,
        ed.institution ?? null,
        ed.degree ?? null,
        ed.field ?? null,
        ed.start_year ?? null,
        ed.end_year ?? null,
      ),
    );
  });

  await env.DB.batch(statements);
}

export async function listCandidates(env: AppEnv, limit = 50): Promise<CandidateRow[]> {
  const res = await env.DB.prepare(
    `SELECT id, created_at, updated_at, status, source_filename, source_r2_key,
            name, email, location, headline, seniority, total_years_experience,
            quality_score
       FROM candidates
      ORDER BY created_at DESC
      LIMIT ?`,
  )
    .bind(limit)
    .all<CandidateRow>();
  return res.results ?? [];
}

export async function getCandidate(
  env: AppEnv,
  id: string,
): Promise<CandidateDetail | null> {
  const row = await env.DB.prepare(
    `SELECT * FROM candidates WHERE id=?`,
  )
    .bind(id)
    .first<Record<string, unknown>>();
  if (!row) return null;

  const skills = await env.DB.prepare(
    `SELECT skill, skill_raw, years_experience FROM candidate_skills WHERE candidate_id=?`,
  )
    .bind(id)
    .all<{ skill: string; skill_raw: string; years_experience: number | null }>();

  const experience = await env.DB.prepare(
    `SELECT company, title, start_date, end_date, is_current, location, description
       FROM candidate_experience WHERE candidate_id=? ORDER BY sort_order ASC`,
  )
    .bind(id)
    .all<{
      company: string | null;
      title: string | null;
      start_date: string | null;
      end_date: string | null;
      is_current: number;
      location: string | null;
      description: string | null;
    }>();

  const education = await env.DB.prepare(
    `SELECT institution, degree, field, start_year, end_year
       FROM candidate_education WHERE candidate_id=?`,
  )
    .bind(id)
    .all<{
      institution: string | null;
      degree: string | null;
      field: string | null;
      start_year: string | null;
      end_year: string | null;
    }>();

  return {
    id: String(row.id),
    created_at: Number(row.created_at),
    updated_at: Number(row.updated_at),
    status: String(row.status),
    source_filename: (row.source_filename as string | null) ?? null,
    source_r2_key: (row.source_r2_key as string | null) ?? null,
    name: (row.name as string | null) ?? null,
    email: (row.email as string | null) ?? null,
    phone: (row.phone as string | null) ?? null,
    location: (row.location as string | null) ?? null,
    headline: (row.headline as string | null) ?? null,
    summary: (row.summary as string | null) ?? null,
    seniority: (row.seniority as string | null) ?? null,
    total_years_experience: (row.total_years_experience as number | null) ?? null,
    work_authorization: (row.work_authorization as string | null) ?? null,
    quality_score: (row.quality_score as number | null) ?? null,
    quality_notes: parseJsonArray<string>(row.quality_notes),
    links: parseJsonObject(row.links),
    skills: skills.results ?? [],
    experience: (experience.results ?? []).map((e) => ({
      ...e,
      is_current: !!e.is_current,
    })),
    education: education.results ?? [],
    parse_error: (row.parse_error as string | null) ?? null,
  };
}

export async function listJobs(env: AppEnv): Promise<Job[]> {
  const res = await env.DB.prepare(
    `SELECT * FROM jobs WHERE status='open' ORDER BY created_at DESC`,
  ).all<Record<string, unknown>>();
  return (res.results ?? []).map(rowToJob);
}

export async function getJob(env: AppEnv, id: string): Promise<Job | null> {
  const row = await env.DB.prepare(`SELECT * FROM jobs WHERE id=?`)
    .bind(id)
    .first<Record<string, unknown>>();
  return row ? rowToJob(row) : null;
}

function rowToJob(row: Record<string, unknown>): Job {
  return JobSchema.parse({
    id: row.id,
    created_at: Number(row.created_at),
    title: row.title,
    company: row.company,
    location: row.location,
    sector: row.sector,
    seniority: row.seniority,
    min_years_experience:
      row.min_years_experience != null ? Number(row.min_years_experience) : null,
    description: row.description,
    must_have_skills: parseJsonArray<string>(row.must_have_skills),
    nice_to_have_skills: parseJsonArray<string>(row.nice_to_have_skills),
    status: row.status,
  });
}

export async function upsertMatches(
  env: AppEnv,
  candidateId: string,
  matches: Array<Omit<Match, "candidate_id" | "computed_at">>,
): Promise<void> {
  if (matches.length === 0) return;
  const now = Date.now();
  const statements = matches.map((m) =>
    env.DB.prepare(
      `INSERT INTO matches
        (candidate_id, job_id, score, skills_overlap, experience_fit, seniority_fit,
         location_fit, matched_skills, missing_skills, reasoning, computed_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(candidate_id, job_id) DO UPDATE SET
        score=excluded.score,
        skills_overlap=excluded.skills_overlap,
        experience_fit=excluded.experience_fit,
        seniority_fit=excluded.seniority_fit,
        location_fit=excluded.location_fit,
        matched_skills=excluded.matched_skills,
        missing_skills=excluded.missing_skills,
        reasoning=excluded.reasoning,
        computed_at=excluded.computed_at`,
    ).bind(
      candidateId,
      m.job_id,
      m.score,
      m.skills_overlap,
      m.experience_fit,
      m.seniority_fit,
      m.location_fit,
      JSON.stringify(m.matched_skills),
      JSON.stringify(m.missing_skills),
      m.reasoning,
      now,
    ),
  );
  await env.DB.batch(statements);
}

export async function getMatchesForCandidate(
  env: AppEnv,
  candidateId: string,
): Promise<Array<Match & { job: Job }>> {
  const res = await env.DB.prepare(
    `SELECT m.*, j.title AS j_title, j.company AS j_company, j.location AS j_location,
            j.sector AS j_sector, j.seniority AS j_seniority,
            j.min_years_experience AS j_min_years, j.description AS j_description,
            j.must_have_skills AS j_must, j.nice_to_have_skills AS j_nice,
            j.status AS j_status, j.created_at AS j_created
       FROM matches m JOIN jobs j ON j.id=m.job_id
      WHERE m.candidate_id=?
      ORDER BY m.score DESC`,
  )
    .bind(candidateId)
    .all<Record<string, unknown>>();
  return (res.results ?? []).map((row) => ({
    candidate_id: String(row.candidate_id),
    job_id: String(row.job_id),
    score: Number(row.score),
    skills_overlap: Number(row.skills_overlap),
    experience_fit: Number(row.experience_fit),
    seniority_fit: Number(row.seniority_fit),
    location_fit: Number(row.location_fit),
    matched_skills: parseJsonArray<string>(row.matched_skills),
    missing_skills: parseJsonArray<string>(row.missing_skills),
    reasoning: String(row.reasoning ?? ""),
    computed_at: Number(row.computed_at),
    job: JobSchema.parse({
      id: row.job_id,
      created_at: Number(row.j_created),
      title: row.j_title,
      company: row.j_company,
      location: row.j_location,
      sector: row.j_sector,
      seniority: row.j_seniority,
      min_years_experience:
        row.j_min_years != null ? Number(row.j_min_years) : null,
      description: row.j_description,
      must_have_skills: parseJsonArray<string>(row.j_must),
      nice_to_have_skills: parseJsonArray<string>(row.j_nice),
      status: row.j_status,
    }),
  }));
}

export async function getMatchesForJob(
  env: AppEnv,
  jobId: string,
): Promise<
  Array<Match & { candidate: { id: string; name: string | null; headline: string | null } }>
> {
  const res = await env.DB.prepare(
    `SELECT m.*, c.name AS c_name, c.headline AS c_headline
       FROM matches m JOIN candidates c ON c.id=m.candidate_id
      WHERE m.job_id=?
      ORDER BY m.score DESC
      LIMIT 50`,
  )
    .bind(jobId)
    .all<Record<string, unknown>>();
  return (res.results ?? []).map((row) => ({
    candidate_id: String(row.candidate_id),
    job_id: String(row.job_id),
    score: Number(row.score),
    skills_overlap: Number(row.skills_overlap),
    experience_fit: Number(row.experience_fit),
    seniority_fit: Number(row.seniority_fit),
    location_fit: Number(row.location_fit),
    matched_skills: parseJsonArray<string>(row.matched_skills),
    missing_skills: parseJsonArray<string>(row.missing_skills),
    reasoning: String(row.reasoning ?? ""),
    computed_at: Number(row.computed_at),
    candidate: {
      id: String(row.candidate_id),
      name: (row.c_name as string | null) ?? null,
      headline: (row.c_headline as string | null) ?? null,
    },
  }));
}

function parseJsonArray<T>(raw: unknown): T[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw as T[];
  try {
    const v = JSON.parse(String(raw));
    return Array.isArray(v) ? (v as T[]) : [];
  } catch {
    return [];
  }
}
function parseJsonObject(raw: unknown): Record<string, string | null> {
  if (!raw) return {};
  try {
    const v = JSON.parse(String(raw));
    return v && typeof v === "object" ? (v as Record<string, string | null>) : {};
  } catch {
    return {};
  }
}
