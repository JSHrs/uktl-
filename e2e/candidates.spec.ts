import { test, expect } from "@playwright/test";

test.describe("Candidate list and detail", () => {
  test("candidates page loads", async ({ page }) => {
    await page.goto("/app/candidates");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/404/);
  });

  test("clicking a candidate navigates to detail", async ({ page }) => {
    await page.goto("/app/candidates");
    const links = page.getByRole("link").filter({ hasText: /./ });
    const count = await links.count();
    if (count === 0) {
      // No candidates yet (preview mode) — skip
      test.skip();
      return;
    }
    await links.first().click();
    await expect(page).toHaveURL(/\/app\/candidates\/.+/);
  });

  test("admin candidate list is accessible after login", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByPlaceholder(/password/i).fill("admin123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.getByRole("link", { name: "Candidates" }).click();
    await expect(page).toHaveURL(/\/admin\/candidates/);
    await expect(page.getByRole("heading", { name: /candidate/i })).toBeVisible();
  });

  test("candidate search filters results", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByPlaceholder(/password/i).fill("admin123");
    await page.getByRole("button", { name: /sign in/i }).click();

    await page.getByRole("link", { name: "Candidates" }).click();
    const search = page.getByPlaceholder(/search/i);
    await search.fill("zzzunlikelytomatch");
    await expect(page.getByText(/no candidates match/i)).toBeVisible();
  });
});
