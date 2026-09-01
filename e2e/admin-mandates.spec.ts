import { test, expect } from "@playwright/test";

// Helper: sign in and navigate to mandates
async function signInAndGoToMandates(page: import("@playwright/test").Page) {
  await page.goto("/admin/login");
  await page.getByPlaceholder(/password/i).fill("admin123");
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
  await page.getByRole("link", { name: "Mandates" }).click();
  await expect(page).toHaveURL(/\/admin\/jobs/);
}

test.describe("Admin — mandate management", () => {
  test("mandates list page loads", async ({ page }) => {
    await signInAndGoToMandates(page);
    await expect(page.getByRole("heading", { name: /mandate/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /add mandate/i })).toBeVisible();
  });

  test("create a new mandate", async ({ page }) => {
    await signInAndGoToMandates(page);
    await page.getByRole("link", { name: /add mandate/i }).click();
    await expect(page).toHaveURL(/\/admin\/jobs\/new/);

    await page.getByLabel(/title/i).fill("E2E Test Solicitor");
    await page.getByLabel(/company/i).fill("Test Firm Ltd");
    await page.getByLabel(/location/i).fill("London, UK");
    await page.getByLabel(/must.have/i).fill("Contract law, GDPR");

    await page.getByRole("button", { name: /create mandate/i }).click();
    await expect(page).toHaveURL(/\/admin\/jobs/);
    await expect(page.getByText("E2E Test Solicitor")).toBeVisible();
  });

  test("edit an existing mandate", async ({ page }) => {
    await signInAndGoToMandates(page);

    // Find the E2E test mandate and click edit
    const row = page.getByRole("row", { name: /E2E Test Solicitor/i });
    await row.getByRole("link", { name: /edit/i }).click();

    await expect(page).toHaveURL(/\/admin\/jobs\/.+/);
    await page.getByLabel(/company/i).fill("Updated Firm");
    await page.getByRole("button", { name: /save changes/i }).click();

    await expect(page).toHaveURL(/\/admin\/jobs/);
    await expect(page.getByText("Updated Firm")).toBeVisible();
  });

  test("delete a mandate", async ({ page }) => {
    await signInAndGoToMandates(page);

    page.once("dialog", (dialog) => dialog.accept());
    const row = page.getByRole("row", { name: /E2E Test Solicitor/i });
    await row.getByRole("button", { name: /delete/i }).click();

    await expect(page.getByText("E2E Test Solicitor")).toBeHidden();
  });
});
