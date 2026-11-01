import { test, expect } from "./fixtures";

test("sign-up asks whether you are looking for work or hiring", async ({ page }) => {
  await page.goto("/auth/register?for=employer");
  await expect(page.getByRole("heading", { level: 1, name: "Create your employer account" })).toBeVisible();
  await expect(page.getByRole("button", { name: "I'm hiring" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "I'm looking for work" }).click();
  await expect(page.getByRole("heading", { level: 1, name: "Create your account" })).toBeVisible();
});

test("candidate sign-up links stay candidate even when viewing as an employer", async ({ page }) => {
  await page.goto("/services?for=employer");
  await page.locator("main").getByRole("link", { name: /Register free/ }).first().click();
  await expect(page).toHaveURL(/for=candidate/);
  await expect(page.getByRole("heading", { level: 1, name: "Create your account" })).toBeVisible();
});

test("employer setup and the employer account require sign-in", async ({ page }) => {
  await page.goto("/auth/employer-setup");
  await expect(page).toHaveURL(/\/auth\/register\?for=employer/);
  await page.goto("/employer");
  await expect(page).toHaveURL(/\/auth\/login/);
});
