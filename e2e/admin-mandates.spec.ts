import { hasStaffCredentials, signInStaff } from "./staff-login";
import { test, expect, type Page } from "./fixtures";

// Creating/editing/deleting rows needs Cloudflare D1. Set E2E_HAS_DB=1 when
// running against wrangler dev or a deployed environment.
const HAS_DB = !!process.env.E2E_HAS_DB;

async function signInAndGoToMandates(page: Page) {
  await signInStaff(page);
  await expect(page).toHaveURL(/\/admin\/?$/);
  await page.getByRole("navigation").getByRole("link", { name: "Mandates", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/jobs/);
}

test.describe.serial("Admin — mandate management", () => {
  test.skip(!hasStaffCredentials, "requires named staging staff credentials and enrolled MFA");
  test("mandates list page loads", async ({ page }) => {
    await signInAndGoToMandates(page);
    await expect(page.getByRole("heading", { name: /mandate/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /add mandate/i })).toBeVisible();
  });

  test.describe("mutations", () => {
    test.skip(!HAS_DB, "needs Cloudflare D1 bindings (E2E_HAS_DB=1)");

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
});

