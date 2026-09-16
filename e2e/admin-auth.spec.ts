import { test, expect } from "./fixtures";

test.describe("Admin authentication", () => {
  test("redirects unauthenticated requests to login", async ({ page }) => {
    await page.goto("/admin");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("redirects unauthenticated /admin/faq to login", async ({ page }) => {
    await page.goto("/admin/faq");
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("shows login form", async ({ page }) => {
    await page.goto("/admin/login");
    await expect(page.getByRole("heading", { name: /admin/i })).toBeVisible();
    await expect(page.getByPlaceholder(/password/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
  });

  test("rejects wrong password", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByPlaceholder(/password/i).fill("wrongpassword");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page.getByText(/invalid/i)).toBeVisible();
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("signs in with dev password and lands on overview", async ({ page }) => {
    await page.goto("/admin/login");
    await page.getByPlaceholder(/password/i).fill("admin123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin\/?$/);
    await expect(page.getByRole("heading", { name: "Overview" })).toBeVisible();
  });

  test("sign out returns to login page", async ({ page }) => {
    // Sign in first
    await page.goto("/admin/login");
    await page.getByPlaceholder(/password/i).fill("admin123");
    await page.getByRole("button", { name: /sign in/i }).click();
    await expect(page).toHaveURL(/\/admin\/?$/);

    // Sign out
    await page.getByRole("button", { name: /sign out/i }).click();
    await expect(page).toHaveURL(/\/admin\/login/);
  });

  test("admin pages are not indexed by search engines", async ({ page }) => {
    await page.goto("/admin/login");
    const robots = await page.locator('meta[name="robots"]').getAttribute("content");
    expect(robots).toMatch(/noindex/);
    expect(robots).toMatch(/nofollow/);
  });
});
