import type { AppEnv } from "./env";
import type { Viewer } from "./access-policy";
export async function conversationOwner(env: AppEnv, viewer: Viewer, candidateId?: string) {
  if (!viewer.userId || viewer.isEmployer) throw new Error("Candidate or staff account required");
  const row =
    viewer.isStaff && candidateId
      ? await env.DB.prepare("SELECT id FROM candidates WHERE id=?")
          .bind(candidateId)
          .first<{ id: string }>()
      : !viewer.isStaff
        ? await env.DB.prepare(
            "SELECT id FROM candidates WHERE auth_user_id=?::uuid ORDER BY created_at DESC LIMIT 1",
          )
            .bind(viewer.userId)
            .first<{ id: string }>()
        : null;
  if (!row)
    throw new Error(
      viewer.isStaff
        ? "Select a candidate conversation"
        : "Upload a CV to open your consultant conversation",
    );
  return row.id;
}
export async function readConversation(
  env: AppEnv,
  viewer: Viewer,
  candidateId?: string,
  before?: {time:number;id:string},
) {
  const id = await conversationOwner(env, viewer, candidateId);
  const rows = await env.DB.prepare(
    `SELECT id,sender_kind,body,created_at FROM conversation_messages WHERE candidate_id=? AND (?::bigint IS NULL OR (created_at,id)<(?::bigint,?::uuid)) ORDER BY created_at DESC,id DESC LIMIT 51`,
  )
    .bind(id, before?.time ?? null, before?.time ?? null,before?.id??null)
    .all<{ id: string; sender_kind: string; body: string; created_at: number }>();
  const messages = (rows.results ?? [])
    .slice(0, 50)
    .map((r) => ({ ...r, created_at: Number(r.created_at) }))
    .reverse();
  return { candidateId: id, messages, next: (rows.results?.length ?? 0) > 50 && messages[0] ? {time:messages[0].created_at,id:messages[0].id} : undefined };
}
export async function postConversation(
  env: AppEnv,
  viewer: Viewer,
  input: { candidateId?: string; id: string; body: string },
) {
  const id = await conversationOwner(env, viewer, input.candidateId);
  const now = Date.now();
  const row = await env.DB.prepare(
    `INSERT INTO conversation_messages(id,candidate_id,sender_id,sender_kind,body,created_at) VALUES(?::uuid,?,?::uuid,?,?,?) ON CONFLICT(id) DO NOTHING RETURNING id`,
  )
    .bind(input.id, id, viewer.userId, viewer.isStaff ? "staff" : "candidate", input.body, now)
    .first();
  if (!row) {
    const existing = await env.DB.prepare(
      "SELECT id FROM conversation_messages WHERE id=?::uuid AND sender_id=?::uuid AND candidate_id=? AND body=?",
    )
      .bind(input.id, viewer.userId, id, input.body)
      .first();
    if (!existing) throw new Error("Message identifier already used");
  }
  return { ok: true };
}
