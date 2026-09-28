import { test } from "node:test";
import assert from "node:assert/strict";
import { describeDatabaseError, withTimeout } from "../src/lib/server/postgres.ts";

test("connection failures are described without credentials, URLs or emails", () => {
  const tls = describeDatabaseError(Object.assign(new Error("self-signed certificate in certificate chain"), { code: "SELF_SIGNED_CERT_IN_CHAIN" }));
  assert.deepEqual(tls, { name: "Error", code: "SELF_SIGNED_CERT_IN_CHAIN", message: "self-signed certificate in certificate chain" });
  const leak = describeDatabaseError(
    Object.assign(new Error("connect failed postgresql://postgres.abc:S3cret@aws-1-eu-west-1.pooler.supabase.com:6543/postgres for jo@example.com password=S3cret"), { code: "ECONNREFUSED" }),
  );
  assert.ok(!/S3cret|example\.com|pooler/.test(leak.message!), leak.message);
  const auth = describeDatabaseError(Object.assign(new Error("password authentication failed for user \"postgres.abc\""), { code: "28P01" }));
  assert.equal(auth.code, "28P01");
  assert.match(auth.message!, /password authentication failed/);
  assert.equal(describeDatabaseError(Object.assign(new Error("tenant/user postgres.abc not found"), { code: "XX000" })).message, "tenant/user postgres.abc not found");
});

test("query/data errors never log their message", () => {
  const dup = describeDatabaseError(Object.assign(new Error('duplicate key value violates unique constraint "candidates_email" (jo@example.com)'), { code: "23505" }));
  assert.deepEqual(dup, { name: "Error", code: "23505", message: undefined });
});

test("stalled operations time out instead of hanging the request", async () => {
  await assert.rejects(withTimeout(new Promise(() => {}), 20, "operation timed out"), /operation timed out/);
  assert.equal(await withTimeout(Promise.resolve(7), 1000, "x"), 7);
});
