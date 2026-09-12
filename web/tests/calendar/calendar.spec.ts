import { test, expect } from '@playwright/test';

test.describe('Calendar Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/calendar');
  });

  test('Calendar renders properly', async ({ page }) => {
    await expect(page.getByText('Scheduling Hub')).toBeVisible({ timeout: 15000 });
    
    // Check for the calendar view controls and action button
    await expect(page.getByRole('button', { name: /new event/i })).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: /month/i })).toBeVisible({ timeout: 10000 });
  });
});
