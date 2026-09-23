import {test,expect} from "./fixtures";
test("interest history requires a signed-in account",async({page})=>{
  await page.goto("/app/activity");await expect(page).toHaveURL(/\/auth\/login/);
});
// The whole candidate area requires sign-in, so the "Discovery is temporarily
// unavailable" state is only reachable by a signed-in user; cover it in staging.
test("discovery requires a signed-in account",async({page})=>{
  await page.goto("/app/discover");await expect(page).toHaveURL(/\/auth\/login\?redirect=/);
  await expect(page.getByText("You're all caught up")).toHaveCount(0);
});
