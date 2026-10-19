import { test } from "node:test";
import assert from "node:assert/strict";
import { createRequestCache } from "../src/lib/server/request-cache.ts";
test("parallel consumers share one verification within a request, never across visitors", async () => {
  const cache = createRequestCache<string>();
  const a = {},
    b = {};
  let calls = 0;
  const load = async () => {
    calls++;
    return "verified";
  };
  assert.deepEqual(await Promise.all([cache.get(a, load), cache.get(a, load)]), [
    "verified",
    "verified",
  ]);
  assert.equal(calls, 1);
  await cache.get(b, load);
  assert.equal(calls, 2);
  cache.clear(a);
  await cache.get(a, load);
  assert.equal(calls, 3);
});
test("failed verification can retry and cookie invalidation cannot reuse old identity", async () => {
  const cache = createRequestCache<string>();
  const request = {};
  await assert.rejects(
    cache.get(request, async () => {
      throw Error("unavailable");
    }),
  );
  assert.equal(await cache.get(request, async () => "alice"), "alice");
  cache.clear(request);
  assert.equal(await cache.get(request, async () => "bob"), "bob");
});
