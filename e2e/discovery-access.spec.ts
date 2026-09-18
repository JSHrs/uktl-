import {test,expect} from "./fixtures";
test("interest history requires a signed-in account",async({page})=>{
  await page.goto("/app/activity");await expect(page).toHaveURL(/\/auth\/login/);
});
if (!process.env.E2E_BASE_URL) test("discovery outages are explicit rather than an empty vacancy pool",async({page})=>{
  await page.goto("/app/discover");
  await expect(page.getByRole("heading",{name:"Discovery is temporarily unavailable"})).toBeVisible();
  await expect(page.getByText("You're all caught up")).toHaveCount(0);
});
