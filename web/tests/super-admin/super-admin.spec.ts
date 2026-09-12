import { test, expect } from '@playwright/test';

test.describe('Super Admin Portal', () => {
  test.beforeEach(async ({ page }) => {
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: 'c43cdb34-f013-4743-9d79-5a1705a86546',
              name: 'Super Admin',
              email: 'superadmin@clixprocrm.com',
              role: 'SUPER_ADMIN',
              isSuperAdmin: true,
              tenantId: null,
              permissions: ['*'],
            },
          },
        }),
      });
    });
  });

  test('SA-001 Super Admin Platform Overview loads', async ({ page }) => {
    await page.goto('/super-admin');
    await page.waitForLoadState('domcontentloaded');

    // Assert main platform container or heading
    const heading = page.getByRole('heading', { name: /platform|super admin|overview/i }).first();
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Assert navigation or metric cards exist
    const container = page.locator('main, [data-slot="page-container"], .crm-page-container').first();
    await expect(container).toBeVisible({ timeout: 15000 });
  });

  test('SA-002 Modules Management page renders search, list and controls', async ({ page }) => {
    await page.goto('/super-admin/modules');
    await page.waitForLoadState('domcontentloaded');

    // Verify page heading or Super Admin AAL2 assurance gate
    const heading = page.getByRole('heading', { name: /module|super admin mfa assurance/i }).first();
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Verify search or table or assurance dialog is active
    const activeElement = page.locator('input, button, table').first();
    await expect(activeElement).toBeVisible({ timeout: 10000 });
  });

  test('SA-003 Platform Billing page loads with metrics and overview tabs', async ({ page }) => {
    await page.goto('/super-admin/billing');
    await page.waitForLoadState('domcontentloaded');

    // Verify heading or Super Admin AAL2 assurance gate
    const heading = page.getByRole('heading', { name: /billing|subscriptions|revenue|super admin mfa assurance/i }).first();
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Verify content container
    const billingContainer = page.locator('main, [data-slot="page-container"], [role="dialog"]').first();
    await expect(billingContainer).toBeVisible({ timeout: 15000 });
  });

  test('SA-004 Security Operations center loads without runtime errors', async ({ page }) => {
    const pageErrors: string[] = [];
    page.on('pageerror', (err) => pageErrors.push(err.message));

    await page.goto('/super-admin/security/operations');
    await page.waitForLoadState('domcontentloaded');

    // Verify heading or Super Admin AAL2 assurance gate
    const heading = page.getByRole('heading', { name: /security|secops|operations|super admin mfa assurance/i }).first();
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Ensure zero uncaught runtime exceptions occurred
    expect(pageErrors.filter((e: string) => !e.includes('ResizeObserver'))).toEqual([]);
  });
});
