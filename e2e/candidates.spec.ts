import { test, expect, type Page } from "./fixtures";

async function signInAsAdmin(page: Page) {
  await page.goto("/admin/login");
  await page.getByPlaceholder(/password/i).fill("admin123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}

test.describe("Candidate list and detail", () => {
  test("signed-out visitors are sent to sign in", async ({ page }) => {
    await page.goto("/app/candidates");
    await expect(page).toHaveURL(/\/auth\/login/);
  });

  test("admin session can open the candidate pool", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/app/candidates");
    await expect(page).toHaveURL(/\/app\/candidates\/?$/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText(/talent/i);
  });

  test("clicking a candidate navigates to detail", async ({ page }) => {
    await signInAsAdmin(page);
    await page.goto("/app/candidates");
    const rows = page.locator("table tbody tr");
    if ((await rows.count()) === 0) {
      test.skip(true, "no candidates in this environment");
      return;
    }
    await rows.first().getByRole("link").first().click();
    await expect(page).toHaveURL(/\/app\/candidates\/.+/);
  });

  test("admin candidate list is accessible after login", async ({ page }) => {
    await signInAsAdmin(page);
    await page.getByRole("navigation").getByRole("link", { name: "Candidates", exact: true }).click();
    await expect(page).toHaveURL(/\/admin\/candidates/);
    await expect(page.getByRole("heading", { name: /candidate/i })).toBeVisible();
  });

  test("candidate search filters results", async ({ page }) => {
    await signInAsAdmin(page);
    await page.getByRole("navigation").getByRole("link", { name: "Candidates", exact: true }).click();
    const search = page.getByPlaceholder(/search/i);
    await search.fill("zzzunlikelytomatch");
    await expect(page.getByText(/no candidates match/i)).toBeVisible();
  });
});
