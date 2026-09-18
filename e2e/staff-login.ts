import { createHmac } from "node:crypto";
import { expect, type Page } from "./fixtures";
export const hasStaffCredentials = !!(process.env.E2E_BASE_URL && process.env.E2E_ADMIN_EMAIL && process.env.E2E_ADMIN_PASSWORD && process.env.E2E_ADMIN_TOTP_SECRET);
function codeFor(secret: string): string {
  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  const chars = secret.toUpperCase().replace(/[\s=]/g, "");
  if (!/^[A-Z2-7]+$/.test(chars)) throw new Error("Invalid test authenticator secret");
  const bits = [...chars].map(c => alphabet.indexOf(c).toString(2).padStart(5, "0")).join("");
  const bytes = Buffer.from(bits.match(/.{8}/g)!.map(b => parseInt(b, 2)));
  const counter = Buffer.alloc(8); counter.writeBigUInt64BE(BigInt(Math.floor(Date.now() / 30000)));
  const digest = createHmac("sha1", bytes).update(counter).digest();
  return ((digest.readUInt32BE(digest[19] & 15) & 0x7fffffff) % 1000000).toString().padStart(6, "0");
}
export async function signInStaff(page: Page) {
  if (!hasStaffCredentials) throw new Error("Named staging staff credentials and enrolled TOTP required");
  await page.goto("/admin/login");
  await page.getByLabel("Staff email").fill(process.env.E2E_ADMIN_EMAIL!);
  await page.getByLabel("Password", { exact: true }).fill(process.env.E2E_ADMIN_PASSWORD!);
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await expect(page).toHaveURL(/\/auth\/security/);
  // A fresh time step prevents replay of a code used by the previous test.
  await page.waitForTimeout(31000 - (Date.now() % 30000));
  await page.getByLabel("Authentication code").fill(codeFor(process.env.E2E_ADMIN_TOTP_SECRET!));
  await page.getByRole("button", { name: "Verify code" }).click();
  await expect(page).toHaveURL(/\/admin\/?$/);
}
