import { test, expect } from "./fixtures";

test("candidate sign-up links stay candidate even when viewing as an employer", async ({ page }) => {
  await page.goto("/services?for=employer");
  await page.locator("main").getByRole("link", { name: /Register free/ }).first().click();
  await expect(page).toHaveURL(/onboarding\?for=candidate/);
  await expect(page.getByRole("heading", { level: 1, name: "Create your free account." })).toBeVisible();
});

test("employer setup and the employer account require sign-in", async ({ page }) => {
  await page.goto("/auth/employer-setup");
  await expect(page).toHaveURL(/\/onboarding\?for=employer&step=1/);
  await page.goto("/employer");
  await expect(page).toHaveURL(/\/auth\/login/);
});

test("employer portal and staff employer-role pages require sign-in", async ({ page }) => {
  for (const path of ["/employer/roles/new", "/employer/company", "/employer/roles/er_0123456789abcdef"]) {
    await page.goto(path);
    await expect(page).toHaveURL(/\/auth\/login/);
  }
  await page.goto("/admin/employer-roles");
  await expect(page).toHaveURL(/\/admin\/login/);
});
