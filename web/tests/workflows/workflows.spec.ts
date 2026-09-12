import { test, expect } from '@playwright/test';

test.describe('Cross-Module Workflows', () => {
  test.beforeEach(async ({ page }) => {
    // Go to dashboard to start from a clean state
    await page.goto('/dashboard');
  });

  test('Workflow 1: Lead -> Deal -> Company -> Pipeline (Simplified Journey)', async ({ page }) => {
    const testId = Date.now();
    const leadName = `E2E_WFL_Lead_${testId}`;

    // 1. Create Lead via unified Contacts
    await page.goto('/leads');
    await expect(page.getByRole('heading', { name: /contacts|leads/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: 'Add Contact' }).click();
    await page.getByRole('menuitem', { name: 'Create Lead' }).click();
    
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();

    await modal.getByLabel(/name/i).first().fill(leadName);
    await modal.getByLabel(/company/i).fill(`Company_${testId}`);
    await modal.getByLabel(/email/i).fill(`wf_${testId}@example.com`);
    await modal.getByRole('button', { name: /save|submit|create/i }).click();
    await expect(page.getByRole('button', { name: leadName, exact: true })).toBeVisible({ timeout: 15000 });

    // 2. Convert or view pipeline
    await page.goto('/pipeline');
    await expect(page.getByRole('heading', { name: /deals & pipeline|deals/i })).toBeVisible({ timeout: 15000 });
  });

  test('Workflow 2: Record CRUD and UI state persistence', async ({ page }) => {
    const testId = Date.now();
    const recordName = `E2E_CRUD_Company_${testId}`;

    await page.goto('/companies');
    await expect(page.getByRole('heading', { name: /companies/i })).toBeVisible({ timeout: 15000 });
    
    // Create
    await page.getByRole('button', { name: /add company|create company/i }).click();
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();

    await modal.getByLabel(/name|company name/i).first().fill(recordName);
    await modal.getByRole('button', { name: /save|submit|create/i }).click();
    await expect(page.getByRole('button', { name: recordName, exact: true }).or(page.getByText(recordName, { exact: true }))).toBeVisible({ timeout: 15000 });

    // Verify persistence across page refresh
    await page.reload();
    await expect(page.getByRole('button', { name: recordName, exact: true }).or(page.getByText(recordName, { exact: true }))).toBeVisible({ timeout: 15000 });
  });
});
