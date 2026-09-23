import { test, expect } from "./fixtures";
for (const scheme of ["light", "dark"] as const) {
  test(`privacy and usage information work on mobile in ${scheme} mode`, async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.emulateMedia({ colorScheme: scheme });
    await page.goto("/privacy");
    await expect(page.getByRole("heading", { level: 1, name: "Your information" })).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
    await page.getByRole("link", { name: "Terms", exact: true }).click();
    await expect(
      page.getByRole("heading", { level: 1, name: "Using Talent Compass" }),
    ).toBeVisible();
    expect(
      await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth),
    ).toBe(true);
  });
}
test("operations and candidate data controls require sign-in", async ({ page }) => {
  await page.goto("/admin/operations");
  await expect(page).toHaveURL(/\/admin\/login/);
  await page.goto("/app/profile");
  await expect(page).toHaveURL(/\/auth\/login/);
});
