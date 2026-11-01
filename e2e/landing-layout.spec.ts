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

test("audience switch swaps the landing page and is remembered", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: /Be seen for/ })).toBeVisible();
  await page.getByRole("button", { name: "I'm hiring" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /The right hire/ })).toBeVisible();
  await expect(page.getByRole("heading", { level: 1, name: /Be seen for/ })).toBeHidden();
  await page.reload();
  await expect(page.getByRole("heading", { level: 1, name: /The right hire/ })).toBeVisible();
});
