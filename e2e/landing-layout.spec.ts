import { test, expect } from "./fixtures";

// The landing page renders a candidate and an employer variant; <html data-for> shows one.
// Decorative product previews are aria-hidden and excluded.
const READABLE = 'main :is(h1, h2, p):visible:not([aria-hidden="true"] *)';

for (const audience of ["candidate", "employer"] as const) {
  for (const width of [320, 375, 390, 768, 1440]) {
    test(`landing headings remain readable at ${width}px (${audience})`, async ({ page }) => {
      await page.setViewportSize({ width, height: 900 });
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.goto(`/?for=${audience}`);
      const items = await page.locator(READABLE).all();
      expect(items.length).toBeGreaterThan(5);
      for (const heading of items) {
        await heading.scrollIntoViewIfNeeded();
        await expect(heading).toBeVisible();
        const metrics = await heading.evaluate((el) => {
          const rect = el.getBoundingClientRect();
          let visible = true;
          for (let node: Element | null = el; node; node = node.parentElement) {
            if (getComputedStyle(node).opacity === "0") visible = false;
          }
          return { left: rect.left, right: rect.right, width: window.innerWidth, visible, overflow: el.scrollWidth > el.clientWidth + 1 };
        });
        expect(metrics.visible, (await heading.textContent()) ?? "Landing text").toBe(true);
        expect(metrics.left).toBeGreaterThanOrEqual(0);
        expect(metrics.right).toBeLessThanOrEqual(metrics.width);
        expect(metrics.overflow).toBe(false);
      }
    });
  }
}

test("audience choice in the hero swaps the page below and is remembered", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 2, name: /Five things a recruiter looks for/ })).toBeVisible();
  await page.getByRole("button", { name: "I'm hiring" }).click();
  await expect(page.getByRole("heading", { level: 2, name: /Change the brief/ })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /Five things a recruiter looks for/ })).toBeHidden();
  await page.reload();
  await expect(page.getByRole("heading", { level: 2, name: /Change the brief/ })).toBeVisible();
});

test("the example shortlist re-ranks when the brief changes", async ({ page }) => {
  await page.goto("/?for=employer");
  const status = page.getByRole("status").filter({ hasText: "qualified" });
  await expect(status).toHaveText("2 of 5 qualified");
  await page.getByRole("button", { name: "Power BI", exact: true }).click();
  await expect(status).toHaveText("1 of 5 qualified");
  await page.getByRole("button", { name: "IFRS", exact: true }).click();
  await page.getByRole("button", { name: "Financial modelling", exact: true }).click();
  await page.getByRole("button", { name: "Power BI", exact: true }).click();
  await expect(status).toHaveText("5 of 5 qualified");
});

test("picking a CV dimension shows its example feedback", async ({ page }) => {
  await page.goto("/");
  await page.getByRole("button", { name: /^Skills/ }).click();
  await expect(page.getByRole("status").filter({ hasText: "Example feedback" })).toContainText("Skills");
  await expect(page.getByRole("button", { name: /^Skills/ })).toHaveAttribute("aria-pressed", "true");
});

test("the hero shows both doors and live office clocks", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Recruitment between the UK and the Gulf");
  await expect(page.getByRole("heading", { level: 2, name: /Be seen for what you can do/ })).toBeVisible();
  await expect(page.getByRole("heading", { level: 2, name: /The right hire, ranked and reasoned/ })).toBeVisible();
  await expect(page.getByLabel("Local time in our two offices")).toContainText(/London \d{2}:\d{2}/);
  await expect(page.getByLabel("Local time in our two offices")).toContainText("5,473 km apart");
});
