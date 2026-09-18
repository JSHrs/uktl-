import {test} from "node:test";
import assert from "node:assert/strict";
import {storeRegisteredCv} from "../src/lib/server/upload-lifecycle.ts";
test("database registration failure never leaves an untracked private object",async()=>{
  let uploads=0;
  await assert.rejects(storeRegisteredCv({register:async()=>{throw new Error("db unavailable");},upload:async()=>{uploads++;},markFailed:async()=>{assert.fail();}}));
  assert.equal(uploads,0);
});
test("provider failure keeps a registered key and records recoverable failure",async()=>{
  const calls:string[]=[];
  assert.equal(await storeRegisteredCv({register:async()=>{calls.push("registered");},upload:async()=>{calls.push("upload");throw new Error("network interrupted");},markFailed:async()=>{calls.push("failed");}}),false);
  assert.deepEqual(calls,["registered","upload","failed"]);
});
test("an outage while marking failure cannot lose the original registration",async()=>{
  let registered=false;
  assert.equal(await storeRegisteredCv({register:async()=>{registered=true;},upload:async()=>{throw new Error("upload uncertain");},markFailed:async()=>{throw new Error("db offline");}}),false);
  assert.equal(registered,true);
});
