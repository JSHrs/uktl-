import type { AppEnv } from "./env";

export async function eraseCandidateRecord(env: AppEnv, id: string, actorId: string) {
  if (env.DATA_BACKEND !== "supabase")
    throw new Error("Safe deletion requires the Supabase backend");
  const row = await env.DB.prepare("SELECT recruitment.queue_candidate_erasure(?,?::uuid) AS id")
    .bind(id, actorId)
    .first<{ id: string | null }>();
  if (!row?.id) throw new Error("Candidate not found");
  // The durable record remains pending on a provider failure. Never claim complete.
  try {
    return await finishFileDeletion(env, row.id);
  } catch {
    return { status: "pending" as const };
  }
}
export async function finishFileDeletion(env: AppEnv, id: string) {
  const row = await env.DB.prepare(
    "SELECT candidate_id,storage_keys,status FROM file_deletions WHERE id=?::uuid",
  )
    .bind(id)
    .first<{ candidate_id: string; storage_keys: string[]; status: string }>();
  if (!row) throw new Error("Deletion request not found");
  if (row.status === "completed") return { status: "completed" as const };
  if (!Array.isArray(row.storage_keys) || row.storage_keys.length > 1000)
    throw new Error("Deletion requires manual review");
  for (const key of row.storage_keys) {
    if (
      typeof key !== "string" ||
      !key.startsWith(`cvs/${row.candidate_id}/`) ||
      key.includes("..")
    )
      throw new Error("Unexpected private object key");
    const referenced = await env.DB.prepare(
      "SELECT 1 AS n FROM candidates WHERE source_r2_key=?1 UNION ALL SELECT 1 FROM cv_versions WHERE storage_key=?1 LIMIT 1",
    )
      .bind(key)
      .first();
    if (referenced) throw new Error("File is referenced; deletion stopped");
    await env.CV_BUCKET.delete(key);
  }
  await env.DB.prepare(
    "UPDATE file_deletions SET status='completed',completed_at=?,storage_keys='[]'::jsonb WHERE id=?::uuid",
  )
    .bind(Date.now(), id)
    .run();
  return { status: "completed" as const };
}

export async function operationsSnapshot(env: AppEnv) {
  if (env.DATA_BACKEND !== "supabase") throw new Error("Operations dashboard requires Supabase");
  const now = Date.now();
  const results = await env.DB.batch([
    env.DB.prepare(
      `SELECT COUNT(*) FILTER(WHERE status='failed')::int AS failed,COUNT(*) FILTER(WHERE status='running' AND locked_at<?)::int AS expired,COUNT(*) FILTER(WHERE status='pending' AND available_at<?)::int AS overdue FROM processing_jobs`,
    ).bind(now - 900000, now - 3600000),
    env.DB.prepare(
      "SELECT sector,status,completed_at,last_error FROM reed_sync_state ORDER BY sector",
    ),
    env.DB.prepare(
      "SELECT id,candidate_id,status,created_at FROM file_deletions WHERE status='pending' ORDER BY created_at LIMIT 100",
    ),
    env.DB.prepare(
      "SELECT id,actor_user_id,actor_kind,action,entity_type,entity_id,created_at FROM audit_events ORDER BY created_at DESC,id DESC LIMIT 100",
    ),
    env.DB.prepare(
      "SELECT model,purpose,status,COUNT(*)::int AS calls,SUM(input_tokens)::text AS input_tokens,SUM(output_tokens)::text AS output_tokens,SUM(cache_read_tokens)::text AS cache_read_tokens,SUM(cache_write_tokens)::text AS cache_write_tokens FROM ai_usage WHERE created_at>? GROUP BY model,purpose,status ORDER BY model,purpose,status",
    ).bind(now - 86400000),
    env.DB.prepare(
      "SELECT id,user_id,kind,status,created_at,updated_at FROM privacy_requests WHERE status IN ('pending','reviewing') ORDER BY created_at LIMIT 100",
    ),
    env.DB.prepare(
      "SELECT COUNT(*)::int AS failed FROM booking_events WHERE delivery_status IN ('failed','skipped')",
    ),
  ]);
  if (results.some((r) => !r.success || !r.results)) throw new Error("Operations data unavailable");
  return {
    checkedAt: now,
    queue: results[0].results![0] as { failed: number; expired: number; overdue: number },
    sync: results[1].results as Record<string, string | number | null>[],
    deletions: results[2].results as { id: string; candidate_id: string; created_at: number }[],
    audit: results[3].results as Record<string, string | number | null>[],
    usage: results[4].results as Record<string, string | number | null>[],
    privacy: results[5].results as {
      id: string;
      user_id: string;
      kind: string;
      status: string;
      created_at: number;
    }[],
    failedDeliveries: Number((results[6].results![0] as { failed: number }).failed),
  };
}
