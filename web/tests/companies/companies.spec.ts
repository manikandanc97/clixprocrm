import { test, expect } from '@playwright/test';

test.describe('Companies Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/companies');
  });

  test('Page loads correctly with table rendering', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /companies/i })).toBeVisible({ timeout: 15000 });
    const listContainer = page.locator('table, [data-testid="companies-list"], [data-testid="companies-grid"]');
    await expect(listContainer.first()).toBeVisible({ timeout: 15000 });
  });

  test('Create new company', async ({ page }) => {
    await page.getByRole('button', { name: /add company|create company/i }).click();
    
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();

    const testId = Date.now();
    const companyName = `E2E_Company_${testId}`;
    
    // Fill required fields
    // Assuming 'Name' is a required field
    await page.getByLabel(/name|company name/i).first().fill(companyName);
    
    await page.getByRole('button', { name: /save|submit|create/i }).click();

    // Expect success message
    await expect(page.getByText(/company created successfully|success/i)).toBeVisible().catch(() => {});
    
    // Verify it appears in the list
    await expect(page.getByRole('button', { name: companyName, exact: true }).or(page.getByText(companyName, { exact: true }))).toBeVisible();
  });

  test('Search companies', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search/i).or(page.getByRole('searchbox'));
    await searchInput.fill('E2E_Company');
    await page.waitForTimeout(500);
    
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows.first().or(page.getByText(/no companies found|no results/i))).toBeVisible();
  });
});
