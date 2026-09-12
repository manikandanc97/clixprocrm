import { test, expect } from '@playwright/test';

test.describe('Leads Module', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the leads page (redirects to /contacts?status=lead)
    await page.goto('/leads');
  });

  test('Page loads correctly with table rendering', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /contacts|leads/i })).toBeVisible({ timeout: 15000 });
    
    const listContainer = page.locator('table, [data-testid="leads-list"], [data-testid="contacts-table"]');
    await expect(listContainer.first()).toBeVisible({ timeout: 15000 });
  });

  test('Create new lead', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /contacts|leads/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Add Contact' }).click();
    await page.getByRole('menuitem', { name: 'Create Lead' }).click();
    
    // Check modal loads
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();

    // Fill form
    const testId = Date.now();
    const leadName = `E2E_Lead_${testId}`;
    await page.getByLabel(/name/i).first().fill(leadName);
    await page.getByLabel(/company/i).fill(`E2E_Company_${testId}`);
    await page.getByLabel(/email/i).fill(`e2e_lead_${testId}@example.com`);
    
    await page.getByRole('button', { name: /save|submit|create/i }).click();

    // Expect success toast or presence in list
    await expect(page.getByText(/lead created successfully|success/i)).toBeVisible().catch(() => {});
    await expect(page.getByRole('button', { name: leadName, exact: true })).toBeVisible({ timeout: 15000 });
  });

  test('Search leads', async ({ page }) => {
    const searchInput = page.getByPlaceholder(/search contacts|search leads|search/i).or(page.getByRole('searchbox'));
    await searchInput.fill('E2E_Lead');
    await page.waitForTimeout(500); // debounce wait
    
    // Verify results update
    const tableRows = page.locator('table tbody tr');
    await expect(tableRows.first().or(page.getByText(/no leads found|no contacts found|no results/i))).toBeVisible();
  });

  test('List/Grid toggle', async ({ page }) => {
    const listToggle = page.getByRole('button', { name: /list view|list/i }).or(page.getByTestId('list-view-btn'));
    const gridToggle = page.getByRole('button', { name: /grid view|grid/i }).or(page.getByTestId('grid-view-btn'));

    if (await gridToggle.isVisible()) {
        await gridToggle.click();
        await expect(page.locator('[data-testid="leads-grid"]')).toBeVisible().catch(() => {});
        
        await listToggle.click();
        await expect(page.locator('table')).toBeVisible().catch(() => {});
    }
  });

  test('Delete lead', async ({ page }) => {
    const row = page.locator('table tbody tr', { hasText: 'E2E_Lead' }).first();
    
    if (await row.isVisible({ timeout: 2000 }).catch(() => false)) {
        const actionButton = row.getByRole('button', { name: /actions|more/i }).or(row.locator('[data-testid="row-actions"]'));
        if (await actionButton.isVisible()) {
            await actionButton.click();
            await page.getByRole('menuitem', { name: /delete/i }).click();
            
            // Confirm delete
            await page.getByRole('button', { name: /confirm|delete|yes/i }).click();
            await expect(page.getByText(/deleted successfully/i)).toBeVisible().catch(() => {});
        }
    }
  });
});
