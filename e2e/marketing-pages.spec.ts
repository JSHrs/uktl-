import { test, expect } from "./fixtures";

const PAGES = ["/services", "/employers", "/approach", "/sectors", "/reach", "/contact", "/privacy", "/terms", "/unsubscribe"];

for (const audience of ["candidate", "employer"] as const) {
  for (const path of PAGES) {
    test(`${path} renders for ${audience}s without sideways scrolling at 375px`, async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 800 });
      await page.goto(`${path}?for=${audience}`);
      await expect(page.locator("main h1:visible").first()).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    });
  }
}

test("how it works shows the employer search for employers", async ({ page }) => {
  await page.goto("/approach?for=employer");
  await expect(page.getByRole("heading", { level: 1, name: /A search you can see into/ })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Recruitment that works for you/ })).toBeHidden();
});

test("employer navigation leads to the employer services page", async ({ page }) => {
  await page.goto("/?for=employer");
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: "Services" }).click();
  await expect(page).toHaveURL(/\/employers/);
  await expect(page.getByRole("heading", { level: 1, name: /Hire with certainty/ })).toBeVisible();
});

test("contact form offers employer enquiry types to employers", async ({ page }) => {
  await page.goto("/contact?for=employer");
  await expect(page.getByLabel("Company")).toBeVisible();
  await expect(page.getByLabel("Type of enquiry")).toContainText("Executive search");
});
