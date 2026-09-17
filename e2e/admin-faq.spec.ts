import { test, expect, type Page } from "./fixtures";

// Creating/editing/deleting rows needs Cloudflare D1. Set E2E_HAS_DB=1 when
// running against wrangler dev or a deployed environment.
const HAS_DB = !!process.env.E2E_HAS_DB;

async function signInAndGoToFaq(page: Page) {
  await page.goto("/admin/login");
  await page.getByPlaceholder(/password/i).fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: /sign in/i }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
  await page.getByRole("navigation").getByRole("link", { name: "FAQ Topics", exact: true }).click();
  await expect(page).toHaveURL(/\/admin\/faq/);
}

test.describe.serial("Admin — FAQ topic management", () => {
  test.skip(!process.env.E2E_ADMIN_PASSWORD || !process.env.E2E_BASE_URL, "requires configured staging credentials");
  test("FAQ list page loads", async ({ page }) => {
    await signInAndGoToFaq(page);
    await expect(page.getByRole("heading", { name: /faq/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /add topic/i })).toBeVisible();
  });

  test.describe("mutations", () => {
    test.skip(!HAS_DB, "needs Cloudflare D1 bindings (E2E_HAS_DB=1)");

    test("create a new FAQ topic", async ({ page }) => {
      await signInAndGoToFaq(page);
      await page.getByRole("link", { name: /add topic/i }).click();
      await expect(page).toHaveURL(/\/admin\/faq\/new/);

      await page.getByLabel(/title/i).fill("E2E Test — Unfair Dismissal");
      await page.getByLabel(/keywords/i).fill("unfair dismissal, employment, rights");

      await page.getByRole("button", { name: /create/i }).click();
      await expect(page).toHaveURL(/\/admin\/faq/);
      await expect(page.getByText(/E2E Test/)).toBeVisible();
    });

    test("edit a FAQ topic", async ({ page }) => {
      await signInAndGoToFaq(page);
      const row = page.getByRole("row", { name: /E2E Test/i });
      await row.getByRole("link", { name: /edit/i }).click();

      await expect(page).toHaveURL(/\/admin\/faq\/.+/);
      await page.getByLabel(/title/i).fill("E2E Test — Wrongful Dismissal Updated");
      await page.getByRole("button", { name: /save/i }).click();

      await expect(page).toHaveURL(/\/admin\/faq/);
      await expect(page.getByText(/Updated/)).toBeVisible();
    });

    test("delete a FAQ topic", async ({ page }) => {
      await signInAndGoToFaq(page);
      page.once("dialog", (dialog) => dialog.accept());
      const row = page.getByRole("row", { name: /E2E Test/i });
      await row.getByRole("button", { name: /delete/i }).click();
      await expect(page.getByText(/E2E Test/)).toBeHidden();
    });
  });
});

