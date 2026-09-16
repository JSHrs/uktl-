import { test as base, expect, type Page } from "@playwright/test";

// The root component sets <html data-hydrated="true"> once React has taken over.
// Interacting before then loses typed input (controlled inputs reset on hydrate)
// and clicks land on SSR-only markup with no handlers, so every goto waits for it.
export const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    const goto = page.goto.bind(page);
    page.goto = async (url: string, options?: Parameters<Page["goto"]>[1]) => {
      const response = await goto(url, options);
      await page
        .locator("html[data-hydrated='true']")
        .waitFor({ state: "attached", timeout: 60_000 });
      return response;
    };
    await use(page);
  },
});

export { expect };
export type { Page };
