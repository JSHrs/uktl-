import test from "node:test";
import assert from "node:assert/strict";
import { nextSetupStep, setupSteps, simulationIdentity, simulationViews, simulateMandateStatus } from "../src/lib/simulation.ts";
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
test("candidate preview never exposes staff operation views", () => {
  for (const view of ["hr", "bookings", "enquiries", "campaigns", "calendar", "analytics", "processing", "operations"]) assert.equal(simulationViews("candidate").includes(view), false);
});
test("closing a filled mandate preserves its placement", () => assert.equal(simulateMandateStatus("filled", "close"), "filled"));
test("reopening a filled mandate explicitly clears its filled status", () => assert.equal(simulateMandateStatus("filled", "reopen"), "open"));