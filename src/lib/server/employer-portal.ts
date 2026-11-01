import type { AppEnv } from "./env";
import { getJob } from "./db.ts";
import { scoreMatch } from "./match.ts";
import { ParsedProfileSchema } from "../schemas/profile.ts";
import { normaliseSkill } from "./skills.ts";

/*
 * Employer portal data access. Every function takes the caller's user id from the
 * server-verified session (never from input) and scopes its SQL to it; staff
 * functions are only called after requireStaff()/requireAdmin() in the handler.
 * Employers never receive candidate ids, names, contact details or CVs: shortlist
 * rows are keyed by an alias ("Candidate A") and carry a consultant-written summary.
 */

export type RoleStatus = "submitted" | "live" | "closed" | "withdrawn";

export type EmployerProfileInput = {
  company_name: string;
  job_title?: string | null;
  website?: string | null;
  headquarters?: string | null;
  company_size?: "1-50" | "51-250" | "251-1000" | "1000+" | null;
  sectors: string[];
  services: string[];
  hiring_markets: string[];
  hiring_volume?: "1-2" | "3-5" | "6-15" | "15+" | null;
};

export type EmployerRoleInput = {
  title: string;
  location?: string | null;
  sector?: string | null;
  seniority?: "junior" | "mid" | "senior" | "lead" | "executive" | null;
  min_years_experience?: number | null;
  salary?: string | null;
  description?: string | null;
  must_have_skills: string[];
  nice_to_have_skills: string[];
};

const json = (v: unknown) => JSON.stringify(v ?? []);
const list = (v: unknown): string[] => {
  if (Array.isArray(v)) return v.map(String);
  if (typeof v === "string") {
    try {
      const parsed = JSON.parse(v);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }
  return [];
};
const num = (v: unknown) => (v == null ? null : Number(v));

function requireSupabase(env: AppEnv) {
  if (env.DATA_BACKEND !== "supabase") throw new Error("The employer portal requires the Supabase backend");
}

/** "Candidate A" … "Candidate Z", then "Candidate AA" … for the nth (0-based) share on a role. */
export function aliasFor(index: number) {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  if (index < 26) return `Candidate ${letters[index]}`;
  const i = index - 26;
  return `Candidate ${letters[Math.floor(i / 26) % 26]}${letters[i % 26]}`;
}


export function newRoleId() {
  return "er_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
}

/* ───────────── Employer (own rows only) ───────────── */

export async function getEmployerProfile(env: AppEnv, userId: string) {
  requireSupabase(env);
  const row = await env.DB.prepare(
    `SELECT company_name, job_title, website, headquarters, company_size, sectors, services, hiring_markets, hiring_volume, updated_at
       FROM employer_profiles WHERE user_id=?::uuid`,
  )
    .bind(userId)
    .first<Record<string, unknown>>();
  if (!row) return null;
  return {
    company_name: String(row.company_name),
    job_title: (row.job_title as string | null) ?? null,
    website: (row.website as string | null) ?? null,
    headquarters: (row.headquarters as string | null) ?? null,
    company_size: (row.company_size as EmployerProfileInput["company_size"]) ?? null,
    sectors: list(row.sectors),
    services: list(row.services),
    hiring_markets: list(row.hiring_markets),
    hiring_volume: (row.hiring_volume as EmployerProfileInput["hiring_volume"]) ?? null,
    updated_at: num(row.updated_at),
  };
}

export async function saveEmployerProfile(env: AppEnv, userId: string, p: EmployerProfileInput, now = Date.now()) {
  requireSupabase(env);
  await env.DB.prepare(
    `INSERT INTO employer_profiles (user_id, company_name, job_title, website, headquarters, company_size, sectors, services, hiring_markets, hiring_volume, created_at, updated_at)
     VALUES (?::uuid, ?, ?, ?, ?, ?, (?::text)::jsonb, (?::text)::jsonb, (?::text)::jsonb, ?, ?::bigint, ?::bigint)
     ON CONFLICT (user_id) DO UPDATE SET company_name=EXCLUDED.company_name, job_title=EXCLUDED.job_title, website=EXCLUDED.website,
       headquarters=EXCLUDED.headquarters, company_size=EXCLUDED.company_size, sectors=EXCLUDED.sectors, services=EXCLUDED.services,
       hiring_markets=EXCLUDED.hiring_markets, hiring_volume=EXCLUDED.hiring_volume, updated_at=EXCLUDED.updated_at`,
  )
    .bind(
      userId,
      p.company_name,
      p.job_title ?? null,
      p.website ?? null,
      p.headquarters ?? null,
      p.company_size ?? null,
      json(p.sectors),
      json(p.services),
      json(p.hiring_markets),
      p.hiring_volume ?? null,
      now,
      now,
    )
    .run();
}

const ROLE_COLUMNS = `r.id, r.created_at, r.updated_at, r.title, r.location, r.sector, r.seniority, r.min_years_experience, r.salary,
  r.description, r.must_have_skills, r.nice_to_have_skills, r.status, r.staff_note, r.reviewed_at`;

function roleFromRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    created_at: Number(row.created_at),
    updated_at: Number(row.updated_at),
    title: String(row.title),
    location: (row.location as string | null) ?? null,
    sector: (row.sector as string | null) ?? null,
    seniority: (row.seniority as EmployerRoleInput["seniority"]) ?? null,
    min_years_experience: num(row.min_years_experience),
    salary: (row.salary as string | null) ?? null,
    description: (row.description as string | null) ?? null,
    must_have_skills: list(row.must_have_skills),
    nice_to_have_skills: list(row.nice_to_have_skills),
    status: row.status as RoleStatus,
    staff_note: (row.staff_note as string | null) ?? null,
    reviewed_at: num(row.reviewed_at),
  };
}
export type EmployerRole = ReturnType<typeof roleFromRow>;

export async function listEmployerRoles(env: AppEnv, userId: string) {
  requireSupabase(env);
  const { results } = await env.DB.prepare(
    `SELECT ${ROLE_COLUMNS},
            (SELECT count(*) FROM employer_shortlist s WHERE s.role_id=r.id) AS shared,
            (SELECT count(*) FROM employer_shortlist s WHERE s.role_id=r.id AND s.employer_decision='pending') AS awaiting
       FROM employer_roles r WHERE r.owner_user_id=?::uuid ORDER BY r.created_at DESC LIMIT 200`,
  )
    .bind(userId)
    .all<Record<string, unknown>>();
  return (results ?? []).map((row) => ({ ...roleFromRow(row), shared: Number(row.shared ?? 0), awaiting: Number(row.awaiting ?? 0) }));
}

function shortlistForEmployer(rows: Record<string, unknown>[]) {
  return rows.map((row) => ({
    alias: String(row.alias),
    summary: String(row.summary),
    score: num(row.score),
    strengths: list(row.strengths),
    gaps: list(row.gaps),
    shared_at: Number(row.shared_at),
    decision: row.employer_decision as "pending" | "interested" | "declined",
    note: (row.employer_note as string | null) ?? null,
  }));
}
export type EmployerShortlistEntry = ReturnType<typeof shortlistForEmployer>[number];

export async function getEmployerRole(env: AppEnv, userId: string, roleId: string) {
  requireSupabase(env);
  const [roleResult, shortlistResult] = await env.DB.batch([
    env.DB.prepare(`SELECT ${ROLE_COLUMNS} FROM employer_roles r WHERE r.id=? AND r.owner_user_id=?::uuid`).bind(roleId, userId),
    env.DB.prepare(
      // Deliberately no candidate_id: the alias is the only handle an employer gets.
      `SELECT s.alias, s.summary, s.score, s.strengths, s.gaps, s.shared_at, s.employer_decision, s.employer_note
         FROM employer_shortlist s JOIN employer_roles r ON r.id=s.role_id
        WHERE s.role_id=? AND r.owner_user_id=?::uuid ORDER BY s.score DESC NULLS LAST, s.shared_at`,
    ).bind(roleId, userId),
  ]);
  const row = (roleResult.results as Record<string, unknown>[] | undefined)?.[0];
  if (!row) return null;
  return { role: roleFromRow(row), shortlist: shortlistForEmployer((shortlistResult.results ?? []) as Record<string, unknown>[]) };
}

export async function createEmployerRole(env: AppEnv, userId: string, input: EmployerRoleInput, now = Date.now()) {
  requireSupabase(env);
  const id = newRoleId();
  await env.DB.prepare(
    `INSERT INTO employer_roles (id, owner_user_id, created_at, updated_at, title, location, sector, seniority, min_years_experience, salary, description, must_have_skills, nice_to_have_skills, status)
     VALUES (?, ?::uuid, ?::bigint, ?::bigint, ?, ?, ?, ?, ?, ?, ?, (?::text)::jsonb, (?::text)::jsonb, 'submitted')`,
  )
    .bind(
      id,
      userId,
      now,
      now,
      input.title,
      input.location ?? null,
      input.sector ?? null,
      input.seniority ?? null,
      input.min_years_experience ?? null,
      input.salary ?? null,
      input.description ?? null,
      json(input.must_have_skills),
      json(input.nice_to_have_skills),
    )
    .run();
  return { id };
}

/** Employers can edit a role until UKTL publishes it. */
export async function updateEmployerRole(env: AppEnv, userId: string, roleId: string, input: EmployerRoleInput, now = Date.now()) {
  requireSupabase(env);
  const row = await env.DB.prepare(
    `UPDATE employer_roles SET title=?, location=?, sector=?, seniority=?, min_years_experience=?, salary=?, description=?,
            must_have_skills=(?::text)::jsonb, nice_to_have_skills=(?::text)::jsonb, updated_at=?::bigint
      WHERE id=? AND owner_user_id=?::uuid AND status='submitted' RETURNING id`,
  )
    .bind(
      input.title,
      input.location ?? null,
      input.sector ?? null,
      input.seniority ?? null,
      input.min_years_experience ?? null,
      input.salary ?? null,
      input.description ?? null,
      json(input.must_have_skills),
      json(input.nice_to_have_skills),
      now,
      roleId,
      userId,
    )
    .first<{ id: string }>();
  if (!row) throw new Error("This role can no longer be edited. Message your consultant to change a live role.");
  return { ok: true };
}

/** Withdraw a submitted role, or close a live one (its mandate closes with it). */
export async function closeEmployerRole(env: AppEnv, userId: string, roleId: string, now = Date.now()) {
  requireSupabase(env);
  const [result] = await env.DB.batch([
    env.DB.prepare(
      `WITH changed AS (
         UPDATE employer_roles SET status = CASE WHEN status='submitted' THEN 'withdrawn' ELSE 'closed' END, updated_at=?::bigint
          WHERE id=? AND owner_user_id=?::uuid AND status IN ('submitted','live') RETURNING id, status, job_id)
       SELECT id, status, job_id FROM changed`,
    ).bind(now, roleId, userId),
    env.DB.prepare(
      `UPDATE jobs SET status='closed', updated_at=?::bigint
        WHERE status='open' AND id=(SELECT job_id FROM employer_roles WHERE id=? AND owner_user_id=?::uuid AND status='closed')`,
    ).bind(now, roleId, userId),
  ]);
  const row = (result.results as { status: string }[] | undefined)?.[0];
  if (!row) throw new Error("This role is already closed");
  return { status: row.status as RoleStatus };
}

export async function decideShortlistEntry(
  env: AppEnv,
  userId: string,
  roleId: string,
  alias: string,
  decision: "interested" | "declined" | "pending",
  note: string | null,
  now = Date.now(),
) {
  requireSupabase(env);
  const row = await env.DB.prepare(
    `UPDATE employer_shortlist SET employer_decision=?, employer_note=?, decided_at=?::bigint
      WHERE role_id=? AND alias=? AND role_id IN (SELECT id FROM employer_roles WHERE owner_user_id=?::uuid) RETURNING alias`,
  )
    .bind(decision, note, decision === "pending" ? null : now, roleId, alias, userId)
    .first<{ alias: string }>();
  if (!row) throw new Error("That candidate is no longer on this shortlist");
  return { ok: true };
}

/* ───────────── Staff (handler has verified staff/admin) ───────────── */

export async function staffListEmployerRoles(env: AppEnv, status?: RoleStatus) {
  requireSupabase(env);
  const { results } = await env.DB.prepare(
    `SELECT ${ROLE_COLUMNS}, r.job_id, p.company_name, a.email AS owner_email,
            (SELECT count(*) FROM employer_shortlist s WHERE s.role_id=r.id) AS shared,
            (SELECT count(*) FROM employer_shortlist s WHERE s.role_id=r.id AND s.employer_decision='interested') AS interested
       FROM employer_roles r
       LEFT JOIN employer_profiles p ON p.user_id=r.owner_user_id
       LEFT JOIN auth_accounts a ON a.id=r.owner_user_id
      WHERE (?::text IS NULL OR r.status=?::text)
      ORDER BY CASE r.status WHEN 'submitted' THEN 0 WHEN 'live' THEN 1 ELSE 2 END, r.created_at DESC LIMIT 500`,
  )
    .bind(status ?? null, status ?? null)
    .all<Record<string, unknown>>();
  return (results ?? []).map((row) => ({
    ...roleFromRow(row),
    job_id: (row.job_id as string | null) ?? null,
    company_name: (row.company_name as string | null) ?? null,
    owner_email: (row.owner_email as string | null) ?? null,
    shared: Number(row.shared ?? 0),
    interested: Number(row.interested ?? 0),
  }));
}

export async function staffGetEmployerRole(env: AppEnv, roleId: string) {
  requireSupabase(env);
  const [roleResult, shortlistResult] = await env.DB.batch([
    env.DB.prepare(
      `SELECT ${ROLE_COLUMNS}, r.job_id, r.owner_user_id, a.email AS owner_email, p.company_name, p.job_title AS contact_title,
              p.website, p.headquarters, p.company_size, p.sectors, p.services, p.hiring_markets, p.hiring_volume
         FROM employer_roles r
         LEFT JOIN employer_profiles p ON p.user_id=r.owner_user_id
         LEFT JOIN auth_accounts a ON a.id=r.owner_user_id
        WHERE r.id=?`,
    ).bind(roleId),
    env.DB.prepare(
      `SELECT s.candidate_id, c.name AS candidate_name, s.alias, s.summary, s.score, s.strengths, s.gaps, s.shared_at,
              s.employer_decision, s.employer_note, s.decided_at
         FROM employer_shortlist s LEFT JOIN candidates c ON c.id=s.candidate_id
        WHERE s.role_id=? ORDER BY s.shared_at`,
    ).bind(roleId),
  ]);
  const row = (roleResult.results as Record<string, unknown>[] | undefined)?.[0];
  if (!row) return null;
  return {
    role: {
      ...roleFromRow(row),
      job_id: (row.job_id as string | null) ?? null,
      owner_email: (row.owner_email as string | null) ?? null,
    },
    company: row.company_name
      ? {
          company_name: String(row.company_name),
          contact_title: (row.contact_title as string | null) ?? null,
          website: (row.website as string | null) ?? null,
          headquarters: (row.headquarters as string | null) ?? null,
          company_size: (row.company_size as string | null) ?? null,
          sectors: list(row.sectors),
          services: list(row.services),
          hiring_markets: list(row.hiring_markets),
          hiring_volume: (row.hiring_volume as string | null) ?? null,
        }
      : null,
    shortlist: ((shortlistResult.results ?? []) as Record<string, unknown>[]).map((s) => ({
      candidate_id: String(s.candidate_id),
      candidate_name: (s.candidate_name as string | null) ?? null,
      ...shortlistForEmployer([s])[0],
      decided_at: num(s.decided_at),
    })),
  };
}

/** Publishes a submitted role as an open mandate, so ranking and pipelines work on it. */
export async function staffPublishRole(env: AppEnv, roleId: string, actorId: string, expiryDate: string | null, now = Date.now()) {
  requireSupabase(env);
  const found = await staffGetEmployerRole(env, roleId);
  if (!found) throw new Error("Role not found");
  if (found.role.status !== "submitted") throw new Error("Only submitted roles can be published");
  const jobId = "job_" + crypto.randomUUID().replace(/-/g, "").slice(0, 16);
  const today = new Date(now).toISOString().slice(0, 10);
  if (expiryDate && expiryDate < today) throw new Error("The closing date is in the past");
  const r = found.role;
  const [, update] = await env.DB.batch([
    env.DB.prepare(
      `INSERT INTO jobs (id, created_at, title, company, location, sector, seniority, min_years_experience, description, must_have_skills, nice_to_have_skills, status, source, posted_date, expiry_date, updated_at)
       VALUES (?, ?::bigint, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'open', 'employer', ?, ?, ?::bigint)`,
    ).bind(
      jobId,
      now,
      r.title,
      found.company?.company_name ?? null,
      r.location,
      r.sector,
      r.seniority,
      r.min_years_experience,
      r.description,
      json(r.must_have_skills),
      json(r.nice_to_have_skills),
      today,
      expiryDate,
      now,
    ),
    env.DB.prepare(
      `UPDATE employer_roles SET status='live', job_id=?, reviewed_by=?::uuid, reviewed_at=?::bigint, updated_at=?::bigint
        WHERE id=? AND status='submitted' RETURNING id`,
    ).bind(jobId, actorId, now, now, roleId),
  ]);
  if (!(update.results?.length ?? 0)) throw new Error("The role changed while publishing; refresh and try again");
  return { jobId };
}

export async function staffSetRoleStatus(env: AppEnv, roleId: string, status: "closed" | "withdrawn", note: string | null, actorId: string, now = Date.now()) {
  requireSupabase(env);
  const [result] = await env.DB.batch([
    env.DB.prepare(
      `UPDATE employer_roles SET status=?, staff_note=COALESCE(?, staff_note), reviewed_by=?::uuid, reviewed_at=?::bigint, updated_at=?::bigint
        WHERE id=? AND status IN ('submitted','live') RETURNING id`,
    ).bind(status, note, actorId, now, now, roleId),
    env.DB.prepare(
      `UPDATE jobs SET status='closed', updated_at=?::bigint WHERE status='open' AND id=(SELECT job_id FROM employer_roles WHERE id=?)`,
    ).bind(now, roleId),
  ]);
  if (!(result.results?.length ?? 0)) throw new Error("This role is already closed");
  return { ok: true };
}

export async function staffSetStaffNote(env: AppEnv, roleId: string, note: string | null, now = Date.now()) {
  requireSupabase(env);
  await env.DB.prepare(`UPDATE employer_roles SET staff_note=?, updated_at=?::bigint WHERE id=?`).bind(note, now, roleId).run();
}

/**
 * Shares a candidate with the employer under the next free alias. The score,
 * strengths and gaps come from the rules-based matcher when the role is live;
 * the summary is written by the consultant and is the only free text shown.
 */
export async function staffShareCandidate(env: AppEnv, roleId: string, candidateId: string, summary: string, actorId: string, now = Date.now()) {
  requireSupabase(env);
  const found = await staffGetEmployerRole(env, roleId);
  if (!found) throw new Error("Role not found");
  if (found.role.status !== "live") throw new Error("Publish the role before sharing candidates");
  const existing = found.shortlist.find((s) => s.candidate_id === candidateId);
  let score: number | null = null;
  let strengths: string[] = [];
  let gaps: string[] = [];
  const job = found.role.job_id ? await getJob(env, found.role.job_id) : null;
  const cand = await env.DB.prepare("SELECT raw_profile FROM candidates WHERE id=? AND status='parsed' AND raw_profile IS NOT NULL")
    .bind(candidateId)
    .first<{ raw_profile: string }>();
  if (!cand && !(await env.DB.prepare("SELECT id FROM candidates WHERE id=?").bind(candidateId).first())) throw new Error("Candidate not found");
  if (job && cand) {
    const parsed = ParsedProfileSchema.safeParse(JSON.parse(cand.raw_profile));
    if (parsed.success) {
      const s = scoreMatch(parsed.data, parsed.data.skills.map((k) => k.skill), job);
      // Show skills in the employer's own wording, not the matcher's normalised form.
      const wording = new Map([...job.must_have_skills, ...job.nice_to_have_skills].map((k) => [normaliseSkill(k), k]));
      const label = (k: string) => wording.get(normaliseSkill(k)) ?? k;
      score = s.score;
      strengths = s.matched_skills.slice(0, 12).map(label);
      gaps = s.missing_skills.slice(0, 12).map(label);
    }
  }
  let alias = existing?.alias;
  if (!alias) {
    // Reserve the next alias atomically; a withdrawn share's alias is never handed out again.
    const reserved = await env.DB.prepare(
      `UPDATE employer_roles SET next_alias_index=next_alias_index+1 WHERE id=? AND next_alias_index<702 RETURNING next_alias_index-1 AS idx`,
    )
      .bind(roleId)
      .first<{ idx: number }>();
    if (!reserved) throw new Error("This role already has the maximum number of shared candidates");
    alias = aliasFor(Number(reserved.idx));
  }
  await env.DB.prepare(
    `INSERT INTO employer_shortlist (role_id, candidate_id, alias, summary, score, strengths, gaps, shared_by, shared_at)
     VALUES (?, ?, ?, ?, ?, (?::text)::jsonb, (?::text)::jsonb, ?::uuid, ?::bigint)
     ON CONFLICT (role_id, candidate_id) DO UPDATE SET summary=EXCLUDED.summary, score=EXCLUDED.score, strengths=EXCLUDED.strengths, gaps=EXCLUDED.gaps`,
  )
    .bind(roleId, candidateId, alias, summary, score, json(strengths), json(gaps), actorId, now)
    .run();
  return { alias };
}

export async function staffUnshareCandidate(env: AppEnv, roleId: string, candidateId: string) {
  requireSupabase(env);
  await env.DB.prepare("DELETE FROM employer_shortlist WHERE role_id=? AND candidate_id=?").bind(roleId, candidateId).run();
  return { ok: true };
}
