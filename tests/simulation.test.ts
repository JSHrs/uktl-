import test from "node:test";
import assert from "node:assert/strict";
import { nextSetupStep, setupSteps, simulationIdentity, simulationViews } from "../src/lib/simulation.ts";
test("candidate preview uses the requested identity", () => assert.equal(simulationIdentity("candidate").email, "jesseharrisode@gmail.com"));
test("admin preview uses the requested identity", () => assert.equal(simulationIdentity("admin").email, "jessejnode85@gmail.com"));
test("setup advances sequentially and stops at completion", () => {
  assert.equal(setupSteps.length, 4);
  assert.deepEqual([0,1,2,3].map(nextSetupStep), [1,2,3,3]);
});
test("candidate simulation does not expose admin candidate management", () => {
  assert.equal(simulationViews("candidate").includes("candidates"), false);
  assert.equal(simulationViews("admin").includes("candidates"), true);
});