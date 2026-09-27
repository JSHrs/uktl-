import { test } from "node:test";
import assert from "node:assert/strict";
import { decodeFlow, encodeFlow } from "../src/lib/server/oauth.ts";

const now = Date.UTC(2026, 8, 27, 12);
const flow = { s: { "uktl-oauth-flow-0123456789abcdef0123456789abcdef-code-verifier": '"v"' }, r: "/app/discover", p: "google" as const, t: now };

test("OAuth flow cookies round-trip and are bounded in time, origin and content", () => {
  assert.deepEqual(decodeFlow(encodeFlow(flow), now + 1000), flow);
  assert.equal(decodeFlow(encodeFlow(flow), now + 601000), null, "expired after 10 minutes");
  assert.equal(decodeFlow(encodeFlow({ ...flow, t: now + 120000 }), now), null, "future-dated flows refused");
  assert.equal(decodeFlow(encodeFlow({ ...flow, r: "//evil.example/x" }), now)!.r, "/app");
  assert.equal(decodeFlow(encodeFlow({ ...flow, p: "github" as any }), now), null, "unknown provider refused");
  assert.equal(decodeFlow(encodeFlow({ ...flow, s: { "sb-other-auth-token": "x" } }), now), null, "only PKCE keys accepted");
  assert.equal(decodeFlow(encodeFlow({ ...flow, s: { "uktl-oauth-x": "a".repeat(2000) } }), now), null);
  assert.equal(decodeFlow(undefined, now), null);
  assert.equal(decodeFlow("%%%", now), null);
});

import { assertSameSupabaseProject, databaseUrlRef, supabaseUrlRef } from "../src/lib/server/supabase-project.ts";
test("sign-in and database must be the same Supabase project", () => {
  const a = "abcdefghijklmnopqrst", b = "upjfkkjrmguuhuzkalji";
  assert.equal(supabaseUrlRef(`https://${a}.supabase.co`), a);
  assert.equal(databaseUrlRef(`postgresql://postgres.${a}:pw@aws-0-eu-west-2.pooler.supabase.com:6543/postgres`), a);
  assert.equal(databaseUrlRef(`postgresql://postgres:pw@db.${a}.supabase.co:5432/postgres`), a);
  assertSameSupabaseProject({ SUPABASE_URL: `https://${a}.supabase.co`, DATABASE_URL: `postgresql://postgres.${a}:pw@x.pooler.supabase.com:6543/postgres` });
  assert.throws(
    () => assertSameSupabaseProject({ SUPABASE_URL: `https://${b}.supabase.co`, DATABASE_URL: `postgresql://postgres.${a}:pw@x.pooler.supabase.com:6543/postgres` }),
    /different Supabase projects/,
  );
  // Unrecognisable URLs (local, custom domains) are not guessed at.
  assertSameSupabaseProject({ SUPABASE_URL: "http://127.0.0.1:54321", DATABASE_URL: "postgresql://postgres:postgres@127.0.0.1:54322/postgres" });
});
