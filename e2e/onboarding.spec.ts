import { test, expect } from "./fixtures";

test("candidate onboarding starts with a free account and shows its steps", async ({ page }) => {
  await page.goto("/onboarding?for=candidate");
  await expect(page.getByRole("heading", { level: 1, name: "Create your free account." })).toBeVisible();
  const rail = page.locator("aside");
  for (const step of ["Account", "Upload CV", "Your score"]) await expect(rail).toContainText(step);
  await expect(page.getByRole("button", { name: "Continue with Google" })).toBeVisible();
});

test("employer onboarding sets up a client portal in five steps", async ({ page }) => {
  await page.goto("/onboarding?for=employer");
  await expect(page.getByRole("heading", { level: 1, name: "Set up your client portal." })).toBeVisible();
  await expect(page.getByLabel("Work email")).toBeVisible();
  for (const step of ["Company", "Your needs", "First role", "All set"]) await expect(page.locator("aside")).toContainText(step);
  await page.getByRole("link", { name: "Looking for work? Create a candidate account" }).click();
  await expect(page).toHaveURL(/for=candidate/);
});

test("later onboarding steps need an account", async ({ page }) => {
  await page.goto("/onboarding?for=employer&step=4");
  await expect(page).toHaveURL(/for=employer&step=1/);
});

test("onboarding stays inside a phone screen", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/onboarding?for=employer");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("header sign-up buttons open onboarding", async ({ page }) => {
  await page.goto("/?for=employer");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Start hiring" }).click();
  await expect(page).toHaveURL(/\/onboarding\?for=employer/);
});
