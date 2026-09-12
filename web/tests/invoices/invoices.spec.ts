import { test, expect } from '@playwright/test';

test.describe('Invoices Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/invoices');
  });

  test('Page loads correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /invoices/i })).toBeVisible({ timeout: 15000 });
    const listContainer = page.locator('table, [data-testid="invoices-list"]');
    await expect(listContainer.first()).toBeVisible({ timeout: 15000 });
  });
});
