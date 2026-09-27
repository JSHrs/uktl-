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
