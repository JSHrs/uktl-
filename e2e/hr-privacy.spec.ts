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
});
test("consultation booking and calendar files require sign-in", async ({ page, request }) => {
  await page.goto("/app/consultations");
  await expect(page).toHaveURL(/\/auth\/login/);
  const ics = await request.get("/api/consultations/cons_synthetic");
  expect(ics.status()).toBe(404);
  const webhook = await request.post("/api/calendly-webhook", { data: {} });
  expect(webhook.status()).not.toBe(200);
});
test("CSV exports are not available without a verified admin session", async ({ request }) => {
  for (const kind of ["candidates", "pipeline", "enquiries", "bookings", "unknown"]) {
    const response = await request.get(`/api/admin/export/${kind}`);
    expect(response.status()).toBe(404);
    expect(response.headers()["content-type"] ?? "").not.toContain("text/csv");
  }
});
