import type { AppEnv } from "./env";
import { saveReedJob, syncReedJobs, type ReedSector, type ReedSyncResult } from "./reed.ts";

// Changing ordering requires a new cursor version/migration, not silently
// interpreting an existing offset against a different query.
export const REED_QUERIES = {
  construction: [
    "construction",
    "quantity surveyor",
    "civil engineer",
    "building surveyor",
    "electrician",
    "plumber",
    "carpenter",
    "bricklayer",
    "roofer",
    "groundworker",
  ],
  technology: [
    "software",
    "developer",
    "devops",
    "cyber security",
    "data engineer",
    "data scientist",
    "IT support",
    "network engineer",
    "cloud engineer",
    "systems administrator",
    "machine learning",
  ],
} as const;
type Lease = {
  sector: ReedSector;
  query_index: number;
  result_offset: number;
  lease_token: string;
  attempts: number;
};
export type SyncState = {
  sector: ReedSector;
  status: string;
  query_index: number;
  result_offset: number;
  attempts: number;
  saved_count: number;
  skipped_count: number;
  started_at: number | null;
  updated_at: number;
  completed_at: number | null;
  last_error: string | null;
};
export async function reedSyncStates(env: AppEnv): Promise<SyncState[]> {
  if (env.DATA_BACKEND !== "supabase") return [];
  const res = await env.DB.prepare(
    `SELECT sector,status,query_index,result_offset,attempts,saved_count,skipped_count,started_at,updated_at,completed_at,last_error FROM reed_sync_state ORDER BY sector`,
  ).all<SyncState>();
  return res.results ?? [];
}
export async function resumeReedSync(
  env: AppEnv,
  sector: ReedSector,
  retryFailed = false,
): Promise<ReedSyncResult & { status: string }> {
  if (env.DATA_BACKEND !== "supabase") throw new Error("Resumable Reed sync requires Supabase");
  if (!env.REED_API_KEY) throw new Error("REED_API_KEY not configured");
  if (sector !== "construction" && sector !== "technology") throw new Error("Invalid sector");
  const lease = await env.DB.prepare("SELECT * FROM recruitment.claim_reed_sync(?,?::boolean)")
    .bind(sector, retryFailed)
    .first<Lease>();
  if (!lease) {
    const state = (await reedSyncStates(env)).find((s) => s.sector === sector);
    return {
      saved: 0,
      skipped: 0,
      failed: state?.status === "failed" ? 1 : 0,
      total: 0,
      partial: state?.status !== "complete",
      status: state?.status ?? "idle",
    };
  }
  const query = REED_QUERIES[sector][lease.query_index];
  try {
    if (!query) throw new Error("Invalid saved query position");
    const result = await syncReedJobs(
      env,
      { keywords: query, sector, resultsToTake: 10 },
      {
        offset: Number(lease.result_offset),
        save: (job) =>
          saveReedJob(env, job, () =>
            env.DB.prepare("SELECT recruitment.assert_reed_sync_lease(?,?::uuid)").bind(
              sector,
              lease.lease_token,
            ),
          ),
      },
    );
    if (result.failed > 0) {
      await env.DB.prepare("SELECT recruitment.fail_reed_sync(?,?::uuid)")
        .bind(sector, lease.lease_token)
        .run();
      return { ...result, status: lease.attempts >= 3 ? "failed" : "retry_pending" };
    }
    const nextQuery = result.exhausted ? lease.query_index + 1 : lease.query_index;
    const done = nextQuery >= REED_QUERIES[sector].length;
    const now = Date.now();
    await env.DB.batch([
      env.DB.prepare("SELECT recruitment.assert_reed_sync_lease(?,?::uuid)").bind(
        sector,
        lease.lease_token,
      ),
      env.DB.prepare(
        `UPDATE reed_sync_state SET query_index=?,result_offset=?,status=?,lease_token=NULL,locked_until=NULL,attempts=0,available_at=0,updated_at=?,completed_at=COALESCE(?,completed_at),saved_count=saved_count+?,skipped_count=skipped_count+?,last_error=NULL WHERE sector=?`,
      ).bind(
        nextQuery,
        result.exhausted ? 0 : result.nextOffset,
        done ? "complete" : "pending",
        now,
        done ? now : null,
        result.saved,
        result.skipped,
        sector,
      ),
    ]);
    return { ...result, partial: !done, status: done ? "complete" : "pending" };
  } catch {
    try {
      await env.DB.prepare("SELECT recruitment.fail_reed_sync(?,?::uuid)")
        .bind(sector, lease.lease_token)
        .run();
    } catch {
      /* Reclaimed leases cannot change newer progress. */
    }
    return {
      saved: 0,
      skipped: 0,
      failed: 1,
      total: 0,
      partial: true,
      status: lease.attempts >= 3 ? "failed" : "retry_pending",
    };
  }
}
