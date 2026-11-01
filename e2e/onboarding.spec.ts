import { test, expect } from "./fixtures";

test("sign in and create account are two sides of one toggle", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/login/);
  const tabs = page.getByRole("navigation", { name: "Account" });
  await expect(tabs.getByRole("link", { name: "Sign in" })).toHaveAttribute("aria-current", "page");
  await tabs.getByRole("link", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/auth\/register/);
  await expect(page.getByRole("navigation", { name: "Account" }).getByRole("link", { name: "Create account" })).toHaveAttribute("aria-current", "page");
});

test("Google and Apple appear as logo buttons below the form", async ({ page }) => {
  await page.goto("/auth/register?for=employer");
  const google = page.getByRole("button", { name: "Continue with Google" });
  const submit = page.getByRole("button", { name: "Create account", exact: true });
  await expect(google).toBeVisible();
  await expect(page.getByRole("button", { name: "Continue with Apple" })).toBeVisible();
  expect((await google.boundingBox())!.y).toBeGreaterThan((await submit.boundingBox())!.y);
  await expect(page.getByText(/Talent Compass/)).toHaveCount(0);
  await expect(page.getByText(/authenticator|two-step/i)).toHaveCount(0);
});

test("the sign-in page has no Talent Compass label or old preview link", async ({ page }) => {
  await page.goto("/auth/login");
  await expect(page.getByText(/Talent Compass/)).toHaveCount(0);
  await expect(page.getByRole("link", { name: /preview/i })).toHaveCount(0);
  const res = await page.request.get("/simulation");
  expect(res.status()).toBe(404);
});

test("guided set-up starts from the shared sign-up page when signed out", async ({ page }) => {
  await page.goto("/onboarding?for=employer&step=4");
  await expect(page).toHaveURL(/\/auth\/register\?for=employer/);
  await expect(page.getByRole("heading", { level: 1, name: "Create your employer account" })).toBeVisible();
});

test("the header has no 'viewing as' bar", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/viewing as/i)).toHaveCount(0);
});

test("two-step code page is only for sign-ins that owe a code", async ({ page }) => {
  await page.goto("/auth/two-step");
  await expect(page).toHaveURL(/\/auth\/login/);
});
