import { test, expect } from "@playwright/test";

test.describe("App navigation", () => {
  test("/ redirects to app", async ({ page }) => {
    await page.goto("/");
    // Either redirects to /app or shows a landing page — not a 404
    await expect(page).not.toHaveURL(/404/);
    const status = await page.evaluate(() => document.title);
    expect(status).not.toMatch(/not found/i);
  });

  test("Overview page loads at /app", async ({ page }) => {
    await page.goto("/app");
    await expect(page).toHaveURL(/\/app/);
    // Main layout renders
    await expect(page.locator("body")).toBeVisible();
  });

  test("Discover page loads at /app/discover", async ({ page }) => {
    await page.goto("/app/discover");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/404/);
  });

  test("HR library page loads at /app/hr", async ({ page }) => {
    await page.goto("/app/hr");
    await expect(page.locator("body")).toBeVisible();
    await expect(page).not.toHaveURL(/404/);
  });

  test("Upload page loads at /app/upload", async ({ page }) => {
    await page.goto("/app/upload");
    await expect(page.getByText(/drag a cv here/i)).toBeVisible();
  });

  test("sidebar navigation links are present", async ({ page }) => {
    await page.goto("/app");
    await expect(page.getByRole("link", { name: /discover/i })).toBeVisible();
    await expect(page.getByRole("link", { name: /upload/i })).toBeVisible();
  });
});
