import { test, expect } from "./fixtures";
test("private HR history and question IDs redirect anonymous visitors to sign-in", async ({
  page,
}) => {
  for (const path of ["/app/hr/history", "/app/hr/answer?id=synthetic-private-id"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/auth\/login/);
  }
});
test("anonymous HR submission never puts sensitive text in the URL", async ({ page }) => {
  await page.goto("/app/hr");
  await page.getByLabel("Your question").fill("Private synthetic workplace concern");
  await page.getByRole("button", { name: "Find answer" }).click();
  await expect(page.getByRole("alert")).toContainText("Sign in first");
  expect(page.url()).not.toContain("Private");
  expect(new URL(page.url()).searchParams.has("q")).toBe(false);
  await expect(page.locator('iframe[src*="calendly"]')).toHaveCount(0);
});
test("unconfigured or unsigned Calendly webhook cannot confirm a booking", async ({ request }) => {
  const response = await request.post("/api/calendly-webhook", {
    data: { event: "invitee.created", payload: { uri: "https://example.invalid/forged" } },
  });
  expect([401, 503]).toContain(response.status());
  expect(await response.text()).not.toContain("received");
});
