import type { AppEnv } from "./env";
import type {
  Lead,
  Candidate,
  ContentItem,
  LeadInput,
  CandidateInput,
  Priority,
  LeadStatus,
  Stage,
  ContentType,
} from "../schemas";

const ID_ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";
function id(prefix: string): string {
  let s = prefix + "_";
  const bytes = crypto.getRandomValues(new Uint8Array(16));
  for (const b of bytes) s += ID_ALPHABET[b % ID_ALPHABET.length];
  return s;
}

// ─── Leads ────────────────────────────────────────────────────────────────────

type LeadRow = {
  id: string;
  created_at: number;
  updated_at: number;
  name: string;
  company: string | null;
  email: string;
  phone: string | null;
  service: string;
  message: string | null;
  score: number;
  priority: string;
  status: string;
  ai_draft: string | null;
};

function rowToLead(r: LeadRow): Lead {
  return {
    id: r.id,
    created_at: r.created_at,
    updated_at: r.updated_at,
    name: r.name,
    company: r.company,
    email: r.email,
    phone: r.phone,
    service: r.service,
    message: r.message,
    score: r.score,
    priority: r.priority as Priority,
    status: r.status as LeadStatus,
    ai_draft: r.ai_draft,
  };
}

export async function listLeads(env: AppEnv): Promise<Lead[]> {
  const res = await env.DB.prepare(
    `SELECT * FROM leads ORDER BY created_at DESC LIMIT 200`,
  ).all<LeadRow>();
  return (res.results ?? []).map(rowToLead);
}

export async function getLead(env: AppEnv, id: string): Promise<Lead | null> {
  const row = await env.DB.prepare(`SELECT * FROM leads WHERE id=?`)
    .bind(id)
    .first<LeadRow>();
  return row ? rowToLead(row) : null;
}

export async function insertLead(
  env: AppEnv,
  lead: LeadInput,
  score: number,
  priority: Priority,
): Promise<Lead> {
  const now = Date.now();
  const newId = id("lead");
  await env.DB.prepare(
    `INSERT INTO leads
       (id, created_at, updated_at, name, company, email, phone, service, message, score, priority, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'New')`,
  )
    .bind(
      newId,
      now,
      now,
      lead.name,
      lead.company ?? null,
      lead.email,
      lead.phone ?? null,
      lead.service,
      lead.message ?? null,
      score,
      priority,
    )
    .run();
  const created = await getLead(env, newId);
  if (!created) throw new Error("Lead insert failed");
  return created;
}

export async function updateLead(
  env: AppEnv,
  id: string,
  patch: { status?: LeadStatus; ai_draft?: string | null },
): Promise<Lead | null> {
  const now = Date.now();
  if (patch.status !== undefined && patch.ai_draft !== undefined) {
    await env.DB.prepare(
      `UPDATE leads SET status=?, ai_draft=?, updated_at=? WHERE id=?`,
    )
      .bind(patch.status, patch.ai_draft, now, id)
      .run();
  } else if (patch.status !== undefined) {
    await env.DB.prepare(
      `UPDATE leads SET status=?, updated_at=? WHERE id=?`,
    )
      .bind(patch.status, now, id)
      .run();
  } else if (patch.ai_draft !== undefined) {
    await env.DB.prepare(
      `UPDATE leads SET ai_draft=?, updated_at=? WHERE id=?`,
    )
      .bind(patch.ai_draft, now, id)
      .run();
  }
  return getLead(env, id);
}

export async function deleteLead(env: AppEnv, id: string): Promise<void> {
  await env.DB.prepare(`DELETE FROM leads WHERE id=?`).bind(id).run();
}

// ─── Candidates ───────────────────────────────────────────────────────────────

type CandidateRow = {
  id: string;
  created_at: number;
  updated_at: number;
  name: string;
  role: string;
  client: string | null;
  email: string | null;
  stage: string;
  score: number;
  notes: string | null;
  ai_analysis: string | null;
};

function rowToCandidate(r: CandidateRow): Candidate {
  return {
    id: r.id,
    created_at: r.created_at,
    updated_at: r.updated_at,
    name: r.name,
    role: r.role,
    client: r.client,
    email: r.email,
    stage: r.stage as Stage,
    score: r.score,
    notes: r.notes,
    ai_analysis: r.ai_analysis,
  };
}

export async function listCandidates(env: AppEnv): Promise<Candidate[]> {
  const res = await env.DB.prepare(
    `SELECT * FROM candidates ORDER BY created_at DESC LIMIT 200`,
  ).all<CandidateRow>();
  return (res.results ?? []).map(rowToCandidate);
}

export async function getCandidate(
  env: AppEnv,
  id: string,
): Promise<Candidate | null> {
  const row = await env.DB.prepare(`SELECT * FROM candidates WHERE id=?`)
    .bind(id)
    .first<CandidateRow>();
  return row ? rowToCandidate(row) : null;
}

export async function insertCandidate(
  env: AppEnv,
  c: CandidateInput,
  score: number,
): Promise<Candidate> {
  const now = Date.now();
  const newId = id("cand");
  await env.DB.prepare(
    `INSERT INTO candidates
       (id, created_at, updated_at, name, role, client, email, stage, score, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  )
    .bind(
      newId,
      now,
      now,
      c.name,
      c.role,
      c.client ?? null,
      c.email ?? null,
      c.stage,
      score,
      c.notes ?? null,
    )
    .run();
  const created = await getCandidate(env, newId);
  if (!created) throw new Error("Candidate insert failed");
  return created;
}

export async function updateCandidate(
  env: AppEnv,
  id: string,
  patch: { stage?: Stage; notes?: string | null; ai_analysis?: string | null },
): Promise<Candidate | null> {
  const now = Date.now();
  const sets: string[] = [];
  const vals: unknown[] = [];
  if (patch.stage !== undefined) {
    sets.push("stage=?");
    vals.push(patch.stage);
  }
  if (patch.notes !== undefined) {
    sets.push("notes=?");
    vals.push(patch.notes);
  }
  if (patch.ai_analysis !== undefined) {
    sets.push("ai_analysis=?");
    vals.push(patch.ai_analysis);
  }
  if (sets.length === 0) return getCandidate(env, id);
  sets.push("updated_at=?");
  vals.push(now);
  vals.push(id);
  await env.DB.prepare(
    `UPDATE candidates SET ${sets.join(", ")} WHERE id=?`,
  )
    .bind(...vals)
    .run();
  return getCandidate(env, id);
}

export async function deleteCandidate(env: AppEnv, id: string): Promise<void> {
  await env.DB.prepare(`DELETE FROM candidates WHERE id=?`).bind(id).run();
}

// ─── Content ──────────────────────────────────────────────────────────────────

type ContentRow = {
  id: string;
  created_at: number;
  title: string;
  type: string;
  tone: string | null;
  content: string;
  word_count: number;
  published: number;
};

function rowToContent(r: ContentRow): ContentItem {
  return {
    id: r.id,
    created_at: r.created_at,
    title: r.title,
    type: r.type as ContentType,
    tone: r.tone,
    content: r.content,
    word_count: r.word_count,
    published: r.published === 1,
  };
}

export async function listContent(env: AppEnv): Promise<ContentItem[]> {
  const res = await env.DB.prepare(
    `SELECT * FROM content_items ORDER BY created_at DESC LIMIT 200`,
  ).all<ContentRow>();
  return (res.results ?? []).map(rowToContent);
}

export async function insertContent(
  env: AppEnv,
  args: {
    title: string;
    type: ContentType;
    tone: string | null;
    content: string;
  },
): Promise<ContentItem> {
  const now = Date.now();
  const newId = id("cont");
  const wordCount = args.content.trim().split(/\s+/).filter(Boolean).length;
  await env.DB.prepare(
    `INSERT INTO content_items
       (id, created_at, title, type, tone, content, word_count, published)
     VALUES (?, ?, ?, ?, ?, ?, ?, 0)`,
  )
    .bind(newId, now, args.title, args.type, args.tone, args.content, wordCount)
    .run();
  const all = await listContent(env);
  return all.find((c) => c.id === newId) ?? all[0];
}

export async function deleteContent(env: AppEnv, id: string): Promise<void> {
  await env.DB.prepare(`DELETE FROM content_items WHERE id=?`).bind(id).run();
}

// ─── Analytics ────────────────────────────────────────────────────────────────

export async function recordEvent(
  env: AppEnv,
  type: string,
  page: string | null,
  metadata: Record<string, unknown> | null,
): Promise<void> {
  await env.DB.prepare(
    `INSERT INTO analytics_events (id, created_at, type, page, metadata)
     VALUES (?, ?, ?, ?, ?)`,
  )
    .bind(
      id("evt"),
      Date.now(),
      type,
      page,
      metadata ? JSON.stringify(metadata) : null,
    )
    .run();
}

export async function analyticsSummary(env: AppEnv): Promise<{
  visitors: number;
  leads: number;
  conversionRate: number;
  topService: string;
  averageScore: number;
}> {
  const sixMonthsAgo = Date.now() - 1000 * 60 * 60 * 24 * 180;
  const visitorsRow = await env.DB.prepare(
    `SELECT COUNT(*) as n FROM analytics_events WHERE type='page_view' AND created_at > ?`,
  )
    .bind(sixMonthsAgo)
    .first<{ n: number }>();
  const leadsRow = await env.DB.prepare(
    `SELECT COUNT(*) as n, AVG(score) as avg_score FROM leads WHERE created_at > ?`,
  )
    .bind(sixMonthsAgo)
    .first<{ n: number; avg_score: number | null }>();
  const topRow = await env.DB.prepare(
    `SELECT service, COUNT(*) as n FROM leads
     WHERE created_at > ?
     GROUP BY service ORDER BY n DESC LIMIT 1`,
  )
    .bind(sixMonthsAgo)
    .first<{ service: string; n: number }>();

  const visitors = visitorsRow?.n ?? 0;
  const leadCount = leadsRow?.n ?? 0;
  return {
    visitors,
    leads: leadCount,
    conversionRate: visitors > 0 ? (leadCount / visitors) * 100 : 0,
    topService: topRow?.service ?? "—",
    averageScore: Math.round(leadsRow?.avg_score ?? 0),
  };
}

export async function leadsByMonth(
  env: AppEnv,
): Promise<{ month: string; count: number }[]> {
  const res = await env.DB.prepare(
    `SELECT strftime('%Y-%m', datetime(created_at/1000, 'unixepoch')) AS month, COUNT(*) AS count
     FROM leads
     GROUP BY month ORDER BY month ASC LIMIT 12`,
  ).all<{ month: string; count: number }>();
  return res.results ?? [];
}

export async function visitorsByMonth(
  env: AppEnv,
): Promise<{ month: string; count: number }[]> {
  const res = await env.DB.prepare(
    `SELECT strftime('%Y-%m', datetime(created_at/1000, 'unixepoch')) AS month, COUNT(*) AS count
     FROM analytics_events
     WHERE type='page_view'
     GROUP BY month ORDER BY month ASC LIMIT 12`,
  ).all<{ month: string; count: number }>();
  return res.results ?? [];
}

export async function serviceBreakdown(
  env: AppEnv,
): Promise<{ name: string; value: number }[]> {
  const res = await env.DB.prepare(
    `SELECT service AS name, COUNT(*) AS value FROM leads
     GROUP BY service ORDER BY value DESC`,
  ).all<{ name: string; value: number }>();
  return res.results ?? [];
}

export async function conversionFunnel(env: AppEnv): Promise<
  { stage: string; n: number }[]
> {
  const visitors = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM analytics_events WHERE type='page_view'`,
  ).first<{ n: number }>();
  const formStart = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM analytics_events WHERE type='form_start'`,
  ).first<{ n: number }>();
  const formSubmit = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM analytics_events WHERE type='form_submit'`,
  ).first<{ n: number }>();
  const total = await env.DB.prepare(`SELECT COUNT(*) AS n FROM leads`).first<{
    n: number;
  }>();
  const qualified = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM leads WHERE status IN ('Qualified','Proposal Sent','Closed Won')`,
  ).first<{ n: number }>();
  const closed = await env.DB.prepare(
    `SELECT COUNT(*) AS n FROM leads WHERE status='Closed Won'`,
  ).first<{ n: number }>();
  return [
    { stage: "Visitors", n: visitors?.n ?? 0 },
    { stage: "Form Started", n: formStart?.n ?? 0 },
    { stage: "Submitted", n: formSubmit?.n ?? total?.n ?? 0 },
    { stage: "Leads", n: total?.n ?? 0 },
    { stage: "Qualified", n: qualified?.n ?? 0 },
    { stage: "Closed", n: closed?.n ?? 0 },
  ];
}
