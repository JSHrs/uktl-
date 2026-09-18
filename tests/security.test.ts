import { databaseFixture } from "./database-fixture.ts";
import { test } from "node:test";
import assert from "node:assert/strict";
import { createSessionToken, verifySessionToken, verifyPassword, hashPassword, TOKEN_TTL_MS } from "../src/lib/server/auth.ts";
import { consumeRateLimit } from "../src/lib/server/ratelimit.ts";
import { resolveCandidateSession } from "../src/lib/server/candidate-session.ts";
import { canAccessCandidate } from "../src/lib/server/access-policy.ts";

test("candidate ownership rejects anonymous and cross-account access", () => {
  assert.equal(canAccessCandidate({ isAdmin: false, userId: null }, null), false);
  assert.equal(canAccessCandidate({ isAdmin: false, userId: "a" }, "b"), false);
  assert.equal(canAccessCandidate({ isAdmin: false, userId: "a" }, null), false);
  assert.equal(canAccessCandidate({ isAdmin: false, userId: "a" }, "a"), true);
  assert.equal(canAccessCandidate({ isAdmin: true, userId: null }, "b"), true);
});

test("refreshed session is not trusted until user validation succeeds", async () => {
  const auth = {
    async refreshSession() { return { data: { session: { access_token: "untrusted", refresh_token: "new", expires_in: 3600 } }, error: null }; },
    async getUser() { return { data: { user: null }, error: new Error("revoked") }; },
  } as any;
  assert.equal((await resolveCandidateSession(auth, undefined, "refresh", async () => { assert.fail(); })).userId, null);
});

test("missing credentials fail closed and configured password is checked", async () => {
  assert.equal(await verifyPassword("admin123", undefined), false);
  assert.equal(await verifyPassword("anything", ""), false);
  const hash = await hashPassword("test-only-password");
  assert.equal(await verifyPassword("test-only-password", hash), true);
  assert.equal(await verifyPassword("wrong", hash), false);
  await assert.rejects(createSessionToken(""));
});

test("signed tokens reject tampering, expired/malformed claims and extra segments", async () => {
  const secret = "test-only-signing-secret";
  const token = await createSessionToken(secret);
  assert.equal(await verifySessionToken(token, secret), true);
  assert.equal(await verifySessionToken(token, "wrong"), false);
  assert.equal(await verifySessionToken(token + ".extra", secret), false);
  assert.equal(await verifySessionToken(token, ""), false);
  async function sign(claims: unknown) {
    const payload = JSON.stringify(claims);
    const key = await crypto.subtle.importKey("raw", new TextEncoder().encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
    const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(payload));
    return `${btoa(payload)}.${Buffer.from(sig).toString("base64")}`;
  }
  for (const claims of [null, {}, { v: 1, exp: "forever" }, { v: 1, exp: Date.now() - 1 },
    { v: 2, exp: Date.now() + 1000 }, { v: 1, exp: Date.now() + TOKEN_TTL_MS * 2 }]) {
    assert.equal(await verifySessionToken(await sign(claims), secret), false);
  }
});


test("all D1 migrations replay and durable limits survive independent requests", async () => {
  const { db, env } = databaseFixture();
  try {
    const results = await Promise.all(Array.from({ length: 12 }, () => consumeRateLimit(env, "cvUpload", "candidate-a")));
    assert.equal(results.filter(r => r.allowed).length, 10);
    assert.equal((await consumeRateLimit(env, "cvUpload", "candidate-b")).allowed, true);
    db.prepare("UPDATE rate_limits SET window_start=? WHERE bucket=?").run(Date.now() - 3600001, "cvUpload:candidate-a");
    assert.equal((await consumeRateLimit(env, "cvUpload", "candidate-a")).allowed, true);
  } finally { db.close(); }
});

test("refresh-only candidate sessions validate identity and persist rotated cookies", async () => {
  const writes: unknown[] = [];
  const auth = {
    async getUser(token: string) { assert.equal(token, "new-access"); return { data: { user: { id: "candidate-a", email: "a@example.test" } }, error: null }; },
    async refreshSession(input: unknown) { assert.deepEqual(input, { refresh_token: "old-refresh" }); return {
      data: { session: { access_token: "new-access", refresh_token: "new-refresh", expires_in: 3600 } }, error: null,
    }; },
  } as any;
  const user = await resolveCandidateSession(auth, undefined, "old-refresh", async (...args) => { writes.push(args); });
  assert.equal(user.userId, "candidate-a");
  assert.deepEqual(writes, [["new-access", "new-refresh", 3600]]);
});

test("expired access token refreshes, but invalid refresh cannot authorize", async () => {
  let calls = 0;
  const auth = {
    async getUser() { return { data: { user: null }, error: new Error("expired") }; },
    async refreshSession() { calls++; return { data: { session: null }, error: new Error("revoked") }; },
  } as any;
  const user = await resolveCandidateSession(auth, "expired", "revoked", async () => { assert.fail("must not persist"); });
  assert.equal(user.userId, null);
  assert.equal(calls, 1);
});

test("valid access tokens do not unnecessarily rotate refresh tokens", async () => {
  const auth = {
    async getUser() { return { data: { user: { id: "candidate-a" } }, error: null }; },
    async refreshSession() { assert.fail("must not refresh"); },
  } as any;
  assert.equal((await resolveCandidateSession(auth, "valid", "refresh", async () => { assert.fail(); })).userId, "candidate-a");
});
