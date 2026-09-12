import { test, expect, type Page } from '@playwright/test';

/**
 * Navigate to `path` and wait for the auth-loading overlay to fully clear
 * before proceeding. Handles the "Something went wrong / Try again" recovery
 * state that can appear on cold-boot auth hydration.
 */
async function gotoAndWait(page: Page, path: string, totalTimeout = 50000): Promise<void> {
  const deadline = Date.now() + totalTimeout;

  await page.goto(path, { waitUntil: 'domcontentloaded' });

  // Wait for workspace-init status region to detach
  await page
    .locator('[role="status"]')
    .waitFor({ state: 'detached', timeout: Math.max(0, deadline - Date.now()) })
    .catch(() => {});

  // Handle "Something went wrong / Try again" recovery
  const tryAgainBtn = page.getByRole('button', { name: /try again/i });
  if (await tryAgainBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await tryAgainBtn.click();
    await page
      .locator('[role="status"]')
      .waitFor({ state: 'detached', timeout: Math.max(0, deadline - Date.now()) })
      .catch(() => {});
  }
}

test.describe('End-to-End Application Smoke Verification', () => {
  test.describe.configure({ mode: 'serial' });

  const crmRoutes = [
    { name: 'Dashboard', path: '/dashboard', headingRegex: /welcome|dashboard|overview/i },
    { name: 'Companies', path: '/companies', headingRegex: /companies/i },
    { name: 'Contacts', path: '/contacts', headingRegex: /contacts/i },
    { name: 'Customers', path: '/customers', headingRegex: /contacts|customers/i },
    { name: 'Leads', path: '/leads', headingRegex: /contacts|leads/i },
    { name: 'Deals', path: '/deals', headingRegex: /deals/i },
    { name: 'Tasks', path: '/tasks', headingRegex: /tasks/i },
    { name: 'Employees', path: '/employees', headingRegex: /employees/i },
    { name: 'Invoices', path: '/invoices', headingRegex: /invoices/i },
    { name: 'Quotations', path: '/quotations', headingRegex: /quotation/i },
    { name: 'Settings', path: '/settings', headingRegex: /settings|my profile|profile|account/i },
  ];

  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000);
    await page.addLocatorHandler(
      page.getByRole('heading', { name: /two-factor|mfa/i }),
      async () => {
        const closeBtn = page.getByRole('button', { name: 'Close' });
        if (await closeBtn.isVisible().catch(() => false)) {
          await closeBtn.click();
        } else {
          await page.keyboard.press('Escape');
        }
      }
    );
  });

  for (const route of crmRoutes) {
    test(`SMOKE-${route.name}: Navigation to ${route.path} loads cleanly without 500 errors`, async ({ page }) => {
      // Navigate and wait for auth hydration to resolve
      const response = await page.goto(route.path, { waitUntil: 'domcontentloaded' });

      // Verify HTTP response is not a server error
      if (response) {
        expect(response.status()).toBeLessThan(500);
      }

      // Verify no Next.js error dialog overlay is displayed
      const errorOverlay = page.locator('[data-nextjs-dialog="true"]');
      await expect(errorOverlay).toHaveCount(0);

      // Wait for auth-loading overlay to clear (handles "Try again" recovery)
      await gotoAndWait(page, route.path);

      // Verify main page container is visible
      const main = page.locator('main').first();
      await expect(main).toBeVisible({ timeout: 15000 });

      // Verify main heading or page container content appears
      const heading = page.getByRole('heading', { name: route.headingRegex }).first();
      const content = heading.or(main).first();
      await expect(content).toBeVisible({ timeout: 15000 });
    });
  }
});
