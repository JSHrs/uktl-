import { test } from "node:test";
import assert from "node:assert/strict";
import { aliasFor, newRoleId } from "../src/lib/server/employer-portal.ts";

test("shared candidates get stable, non-identifying aliases", () => {
  assert.equal(aliasFor(0), "Candidate A");
  assert.equal(aliasFor(25), "Candidate Z");
  assert.equal(aliasFor(26), "Candidate AA");
  assert.equal(aliasFor(27), "Candidate AB");
  assert.ok(Array.from({ length: 702 }, (_, i) => aliasFor(i)).every((a) => /^Candidate [A-Z]{1,2}$/.test(a)), "every alias passes the database check");
  assert.equal(new Set(Array.from({ length: 702 }, (_, i) => aliasFor(i))).size, 702);
});

test("role ids match the database format", () => {
  assert.match(newRoleId(), /^er_[a-f0-9]{16}$/);
});
