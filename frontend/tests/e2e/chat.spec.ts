import { test, expect } from '@playwright/test';

test('full chat flow with tool rendering', async ({ page }) => {
  // Navigate to the dev server (assumed running)
  await page.goto('http://localhost:3000');
  // Open chat
  await page.getByLabel('Open chat').click();
  // Type a prompt that triggers tool response
  await page.getByPlaceholder('Ask something...').fill('List the top three projects.');
  await page.getByRole('button', { name: 'Send' }).click();
  // Wait for tool card to appear
  await expect(page.locator('[data-testid="project-card"]').filter({ hasText: 'Project A' })).toBeVisible({ timeout: 5000 });
});
