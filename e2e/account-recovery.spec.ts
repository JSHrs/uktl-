import { test, expect } from "./fixtures";
test("recovery offers password reset rather than sign-in only", async ({ page }) => {
  await page.goto("/auth/forgot");
  await expect(page.getByRole("heading", { name: "Reset password" })).toBeVisible();
  await expect(page.getByLabel("Email address")).toBeVisible();
  await expect(page.getByRole("button", { name: /send.*link/i })).toBeVisible();
});
test("reset cannot set a password without a verified session", async ({ page }) => {
  await page.goto("/auth/reset");
  await expect(page.getByRole("heading", { name: "Request a recovery link" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Update password" })).toHaveCount(0);
});
test("anonymous user cannot enroll a staff authenticator", async ({ page }) => {
  await page.goto("/auth/security");
  await expect(page).toHaveURL(/\/admin\/login/);
});
test("incomplete callback clears sensitive fragment and rejects link", async ({ page }) => {
  await page.goto("/auth/callback#access_token=invalid");
  await expect(page.getByRole("heading", { name: "That link didn't work" })).toBeVisible();
  await expect(page).not.toHaveURL(/access_token/);
});
