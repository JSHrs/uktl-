import { test } from "node:test";
import assert from "node:assert/strict";
import { hasStaffAccess, readStaffAccess } from "../src/lib/server/staff-access.ts";
import { canAccessCandidate } from "../src/lib/server/access-policy.ts";
test("privileges require both current membership and MFA", () => {
  for (const role of [null, "admin", "consultant"] as const) {
    assert.equal(hasStaffAccess({ role, mfa_verified: false }), false);
    assert.equal(hasStaffAccess({ role, mfa_verified: true }), role !== null);
    assert.equal(hasStaffAccess({ role, mfa_verified: true }, true), role === "admin");
  }
});
test("staff RPC errors and malformed responses fail closed", async () => {
  for (const data of [null, {}, {role:"owner",mfa_verified:true}, {role:"admin",mfa_verified:"true"}]) {
    await assert.rejects(readStaffAccess({rpc: async () => ({data,error:null})} as any));
  }
  await assert.rejects(readStaffAccess({rpc: async () => ({data:{role:"admin",mfa_verified:true},error:new Error("outage")})} as any));
  assert.deepEqual(await readStaffAccess({rpc: async () => ({data:{role:"consultant",mfa_verified:true},error:null})} as any), {role:"consultant",mfa_verified:true});
});
test("consultants can review candidates but ordinary users stay scoped", () => {
  assert.equal(canAccessCandidate({isAdmin:false,isStaff:true,userId:"staff"},"candidate"),true);
  assert.equal(canAccessCandidate({isAdmin:false,isStaff:false,userId:"staff"},"candidate"),false);
});
