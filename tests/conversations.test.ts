import { test } from "node:test";
import assert from "node:assert/strict";
import { conversationOwner, postConversation } from "../src/lib/server/conversations.ts";
const candidate = { userId: "owner", isAdmin: false, isStaff: false };
function env(rows: any[]) {
  const calls: any[] = [];
  return {
    calls,
    DATA_BACKEND: "supabase",
    DB: {
      prepare(sql: string) {
        return {
          bind(...args: any[]) {
            calls.push({ sql, args });
            return this;
          },
          async first() {
            return rows.shift() ?? null;
          },
        };
      },
    },
  } as any;
}
test("candidate thread selection ignores a supplied foreign candidate id and binds verified owner", async () => {
  const db = env([{ id: "own-record" }]);
  assert.equal(await conversationOwner(db, candidate, "foreign"), "own-record");
  assert.deepEqual(db.calls[0].args, ["owner"]);
  assert.match(db.calls[0].sql, /auth_user_id/);
});
test("anonymous and employer accounts cannot access recruitment conversations", async () => {
  await assert.rejects(conversationOwner(env([]), { userId: null, isAdmin: false }), /required/);
  await assert.rejects(conversationOwner(env([]), { ...candidate, isEmployer: true }), /required/);
});
test("staff must select an existing candidate and unlinked candidates fail closed", async () => {
  await assert.rejects(conversationOwner(env([]), { ...candidate, isStaff: true }), /Select/);
  await assert.rejects(conversationOwner(env([]), candidate), /Upload/);
});
test("send retry only accepts an identical message owned by the same sender", async () => {
  const db = env([{ id: "own" }, null, null]);
  await assert.rejects(
    postConversation(db, candidate, { id: "message", body: "hello" }),
    /identifier/,
  );
  assert.deepEqual(db.calls[2].args, ["message", "owner", "own", "hello"]);
});
