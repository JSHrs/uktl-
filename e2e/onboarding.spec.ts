import { test, expect } from "./fixtures";

test("sign in and create account are two sides of one toggle", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/login/);
  const tabs = page.getByRole("navigation", { name: "Account" });
  await expect(tabs.getByRole("link", { name: "Sign in" })).toHaveAttribute("aria-current", "page");
  await tabs.getByRole("link", { name: "Create account" }).click();
  await expect(page).toHaveURL(/\/onboarding\?for=candidate&step=1/);
  await expect(page.getByRole("navigation", { name: "Account" }).getByRole("link", { name: "Create account" })).toHaveAttribute("aria-current", "page");
});

test("account creation is step 1 of onboarding, with the steps shown", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: /register free/i }).click();
  await expect(page).toHaveURL(/\/onboarding\?for=candidate&step=1/);
  await expect(page.getByRole("heading", { level: 1, name: "Create your free account." })).toBeVisible();
  for (const step of ["Account", "Upload CV", "Your score"]) await expect(page.locator("aside")).toContainText(step);
  await expect(page.getByText("Step 1 of 3")).toBeVisible();
});

test("employer onboarding starts with the account step of five", async ({ page }) => {
  await page.goto("/?for=employer");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Start hiring" }).click();
  await expect(page).toHaveURL(/\/onboarding\?for=employer&step=1/);
  await expect(page.getByRole("heading", { level: 1, name: "Set up your client portal." })).toBeVisible();
  await expect(page.getByLabel("Work email")).toBeVisible();
  for (const step of ["Company", "Your needs", "First role", "All set"]) await expect(page.locator("aside")).toContainText(step);
  await page.getByRole("link", { name: "Looking for work? Create a candidate account" }).click();
  await expect(page).toHaveURL(/for=candidate/);
});

test("Google and Apple appear as logo buttons below the form", async ({ page }) => {
  await page.goto("/onboarding?for=employer&step=1");
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

test("later onboarding steps send signed-out visitors to step 1", async ({ page }) => {
  await page.goto("/onboarding?for=employer&step=4");
  await expect(page).toHaveURL(/\/onboarding\?for=employer&step=1/);
  await page.goto("/auth/register?for=employer");
  await expect(page).toHaveURL(/\/onboarding\?for=employer&step=1/);
});

test("onboarding stays inside a phone screen", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 800 });
  await page.goto("/onboarding?for=employer&step=1");
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
});

test("the header has no 'viewing as' bar", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText(/viewing as/i)).toHaveCount(0);
});

test("two-step code page is only for sign-ins that owe a code", async ({ page }) => {
  await page.goto("/auth/two-step");
  await expect(page).toHaveURL(/\/auth\/login/);
});
