import { test, expect } from "./fixtures";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const FIXTURE_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures");

// Ensure fixture files exist for tests
test.beforeAll(() => {
  fs.mkdirSync(FIXTURE_DIR, { recursive: true });

  // Minimal plain-text CV fixture
  fs.writeFileSync(
    path.join(FIXTURE_DIR, "sample-cv.txt"),
    `John Smith
john@example.com | +44 7700 900000 | London, UK

EXPERIENCE
Senior Solicitor — Cranbrook Legal (2020–Present)
  - Contract review and negotiation
  - GDPR compliance advice
  - Employment disputes

EDUCATION
LLB Law — University of Manchester (2015)

SKILLS
Contract Law, Employment Law, GDPR, Mediation
`,
  );
});

test.describe("CV upload page", () => {
  test("upload page renders drag-and-drop zone", async ({ page }) => {
    await page.goto("/app/upload");
    await expect(page.getByText(/drag a cv here/i)).toBeVisible();
    await expect(page.getByText(/parse & match/i)).toBeVisible();
  });

  test("Parse & match button is disabled without a file", async ({ page }) => {
    await page.goto("/app/upload");
    const btn = page.getByRole("button", { name: /parse & match/i });
    await expect(btn).toBeDisabled();
  });

  test("selecting a file enables the submit button", async ({ page }) => {
    await page.goto("/app/upload");
    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.locator('[aria-label="Click or drag a file to upload"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(FIXTURE_DIR, "sample-cv.txt"));

    await expect(page.getByText("sample-cv.txt")).toBeVisible();
    await expect(page.getByRole("button", { name: /parse & match/i })).toBeEnabled();
  });

  test("rejects files over 10 MB", async ({ page }) => {
    await page.goto("/app/upload");

    // Create a > 10 MB file
    const bigFilePath = path.join(FIXTURE_DIR, "big-file.txt");
    fs.writeFileSync(bigFilePath, Buffer.alloc(11 * 1024 * 1024, "a"));

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.locator('[aria-label="Click or drag a file to upload"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(bigFilePath);

    await expect(page.getByText(/too large/i)).toBeVisible();
    await expect(page.getByRole("button", { name: /parse & match/i })).toBeDisabled();

    fs.unlinkSync(bigFilePath);
  });

  test("signed-out upload requires sign-in", async ({ page }) => {
    await page.goto("/app/upload");

    const fileChooserPromise = page.waitForEvent("filechooser");
    await page.locator('[aria-label="Click or drag a file to upload"]').click();
    const fileChooser = await fileChooserPromise;
    await fileChooser.setFiles(path.join(FIXTURE_DIR, "sample-cv.txt"));

    await page.getByRole("button", { name: /parse & match/i }).click();

    await expect(page.getByText(/please sign in/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(page).toHaveURL(/\/app\/upload/);
  });
});

