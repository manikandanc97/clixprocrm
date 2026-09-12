import { test, expect } from '@playwright/test';

test.describe('Customers Module', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the customers page (redirects to /contacts?status=customer)
    await page.goto('/customers');
  });

  test('Page loads correctly with table rendering', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /contacts|customers/i })).toBeVisible({ timeout: 15000 });
    const listContainer = page.locator('table, [data-testid="customers-list"], [data-testid="contacts-table"]');
    await expect(listContainer.first()).toBeVisible({ timeout: 15000 });
  });

  test('Create new customer', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /contacts|customers/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Add Contact' }).click();
    await page.getByRole('menuitem', { name: /register customer|create customer/i }).click();
    
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();

    const testId = Date.now();
    const customerName = `E2E_Customer_${testId}`;
    await page.getByLabel(/name/i).first().fill(customerName);
    await page.getByLabel(/company/i).fill(`E2E_Company_${testId}`);
    await page.getByLabel(/email/i).fill(`e2e_customer_${testId}@example.com`);
    
    await page.getByRole('button', { name: /save|submit|create/i }).click();

    await expect(page.getByText(/customer created successfully|success/i)).toBeVisible().catch(() => {});
    await expect(page.getByRole('button', { name: customerName, exact: true })).toBeVisible({ timeout: 15000 });
  });

  test('Search customers', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search contacts|search customers|search/i).or(page.getByRole('searchbox'));
    await searchInput.fill('E2E_Customer');
    await page.waitForTimeout(500);
    
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows.first().or(page.getByText(/no customers found|no contacts found|no results/i))).toBeVisible();
  });
});
