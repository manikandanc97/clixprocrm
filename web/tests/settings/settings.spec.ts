import { test, expect } from '@playwright/test';

test.describe('Settings Module', () => {
  test('Settings page loads', async ({ page }) => {
    await page.goto('/settings');
    await expect(page.getByRole('heading', { name: /my profile|profile|settings/i }).first()).toBeVisible({ timeout: 15000 });
    await expect(page.locator('body')).toBeVisible();
  });
});
