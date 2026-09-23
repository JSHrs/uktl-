import { test, expect } from "./fixtures";
test("private HR history and question IDs redirect anonymous visitors to sign-in", async ({
  page,
}) => {
  for (const path of ["/app/hr/history", "/app/hr/answer?id=synthetic-private-id"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/auth\/login/);
  }
});
test("anonymous visitors are sent to sign in before they can type an HR question", async ({ page }) => {
  await page.goto("/app/hr");
  await expect(page).toHaveURL(/\/auth\/login/);
  const url = new URL(page.url());
  expect(url.searchParams.get("redirect")).toBe("/app/hr");
  expect(url.searchParams.has("q")).toBe(false);
  await expect(page.getByLabel("Your question")).toHaveCount(0);
  await expect(page.locator('iframe[src*="calendly"]')).toHaveCount(0);
});
test("unconfigured or unsigned Calendly webhook cannot confirm a booking", async ({ request }) => {
  const response = await request.post("/api/calendly-webhook", {
    data: { event: "invitee.created", payload: { uri: "https://example.invalid/forged" } },
  });
  expect([401, 503]).toContain(response.status());
  expect(await response.text()).not.toContain("received");
});
