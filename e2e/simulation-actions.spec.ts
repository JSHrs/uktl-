import { test, expect } from '@playwright/test';
test('completed candidate preview expands a role and records local interest', async ({ page }) => {
  await page.goto('/simulation?role=candidate');
  await expect(page.getByText('4 of 4 complete')).toBeVisible();
  await page.getByText('Explore role, match evidence and next steps').click();
  await page.getByRole('button', {name:'Express sample interest'}).click();
  await expect(page.getByText('Interest recorded in this preview.', {exact:false})).toBeVisible();
  await page.getByRole('button', {name:'Withdraw sample interest'}).click();
  await expect(page.getByText('No interest recorded.', {exact:false})).toBeVisible();
  await page.getByRole('button', {name:'Replay onboarding'}).click();
  await expect(page.getByText('Step 1 of 4')).toBeVisible();
});
test('admin enquiry action opens an editable result without a live send', async ({page}) => {
  await page.goto('/simulation?role=admin&view=enquiries');
  await page.getByRole('button', {name:'Preview reply'}).click();
  await page.getByLabel('Editable preview').fill('A revised sample reply');
  await page.getByRole('button', {name:'Save preview', exact:true}).click();
  await expect(page.getByRole('status')).toContainText('No message sent');
  await page.getByRole('button', {name:'Operations & privacy',exact:true}).click();
  await expect(page.getByText('Preview saved: A revised sample reply')).toBeVisible();
});
