import postgres from "postgres";
import assert from "node:assert/strict";
import { postgresQuery } from "../src/lib/server/postgres.ts";
import { resumeReedSync, REED_QUERIES, reedSyncStates } from "../src/lib/server/reed-sync.ts";
const url =
  process.env.TEST_DATABASE_URL ?? "postgresql://postgres:postgres@127.0.0.1:54322/postgres";
if (!["127.0.0.1", "localhost"].includes(new URL(url).hostname))
  throw new Error("Only isolated local database allowed");
const sql = postgres(url, { max: 1, prepare: false });
const original = globalThis.fetch;
class Rollback extends Error {}
try {
  await sql.begin(async (tx) => {
    await tx`SET LOCAL search_path=recruitment,public`;
    const env = {
      DATA_BACKEND: "supabase",
      REED_API_KEY: "test-only",
      DB: {
        prepare(query: string) {
          let values: unknown[] = [];
          return {
            bind(...args: unknown[]) {
              values = args;
              return this;
            },
            async execute(connection?: typeof tx) {
              const q = postgresQuery(query, values);
              const run = (c: typeof tx) => c.unsafe(q.sql, q.values as any[]);
              return connection ? run(connection) : tx.savepoint(run);
            },
            async first() {
              return (await this.execute())[0] ?? null;
            },
            async all() {
              return { success: true, results: await this.execute() };
            },
            async run() {
              return { success: true, results: await this.execute() };
            },
          };
        },
        async batch(statements: any[]) {
          return tx.savepoint(async (sub) => {
            const result = [];
            for (const s of statements)
              result.push({ success: true, results: await s.execute(sub) });
            return result;
          });
        },
      },
    } as any;
    let fail = false;
    const offsets: number[] = [];
    globalThis.fetch = async (input) => {
      const u = new URL(String(input));
      if (u.pathname.endsWith("/search")) {
        if (u.searchParams.get("keywords") !== "software")
          return Response.json({ results: [], totalResults: 0 });
        const offset = Number(u.searchParams.get("resultsToSkip"));
        offsets.push(offset);
        return Response.json({
          results: Array.from({ length: Math.max(0, Math.min(10, 12 - offset)) }, (_, i) => ({
            jobId: offset + i + 8000,
          })),
          totalResults: 12,
        });
      }
      if (fail) return new Response("private API diagnostics", { status: 503 });
      return Response.json({ jobTitle: "Software engineer", expirationDate: "01/01/2099" });
    };
    assert.equal((await resumeReedSync(env, "technology")).status, "pending");
    let state = (await reedSyncStates(env))[0];
    assert.equal(Number(state.result_offset), 10);
    assert.equal(state.query_index, 0);
    fail = true;
    assert.equal((await resumeReedSync(env, "technology")).status, "retry_pending");
    state = (await reedSyncStates(env))[0];
    assert.equal(Number(state.result_offset), 10);
    assert.ok(!state.last_error?.includes("private"));
    assert.equal(
      (await resumeReedSync(env, "technology")).saved,
      0,
      "backoff makes no provider requests",
    );
    await tx`UPDATE reed_sync_state SET available_at=0 WHERE sector='technology'`;
    fail = false;
    assert.equal((await resumeReedSync(env, "technology")).status, "pending");
    state = (await reedSyncStates(env))[0];
    assert.equal(state.query_index, 1);
    assert.equal(Number(state.result_offset), 0);
    assert.deepEqual(offsets, [0, 10, 10]);
    for (let i = 1; i < REED_QUERIES.technology.length; i++)
      await resumeReedSync(env, "technology");
    state = (await reedSyncStates(env))[0];
    assert.equal(state.status, "complete");
    assert.equal(Number(state.saved_count), 12);
    assert.equal((await tx`SELECT count(*)::int n FROM jobs WHERE source='reed'`)[0].n, 12);
    const calls = offsets.length;
    assert.equal((await resumeReedSync(env, "technology")).status, "complete");
    assert.equal(offsets.length, calls);
    assert.ok(!("lease_token" in state), "status endpoint must omit worker tokens");
    // Old worker may not commit vacancy writes after another worker reclaims it.
    const old = (await tx`SELECT * FROM claim_reed_sync('construction')`)[0];
    await tx`UPDATE reed_sync_state SET locked_until=0 WHERE sector='construction'`;
    const fresh = (await tx`SELECT * FROM claim_reed_sync('construction')`)[0];
    await assert.rejects(
      tx.savepoint(async (sub) => {
        await sub`SELECT assert_reed_sync_lease('construction',${old.lease_token}::uuid)`;
      }),
    );
    assert.notEqual(old.lease_token, fresh.lease_token);
    throw new Rollback();
  });
  throw new Error("Fixtures were not rolled back");
} catch (e) {
  if (!(e instanceof Rollback)) throw e;
} finally {
  globalThis.fetch = original;
  await sql.end();
}
console.log(
  "PASS: resumable search cursor, safe retry/backoff, multiple queries, same-day idling and lease fencing; all fixtures rolled back",
);
