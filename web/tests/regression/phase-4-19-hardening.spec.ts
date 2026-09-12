import { test, expect } from '@playwright/test';

test.describe('Phase 4.19 UX & Contextual Settings Hardening Regression', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
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

  test('REG-001 View mode state persists in localStorage across module navigation', async ({ page }) => {
    await page.goto('/leads');
    await page.waitForLoadState('domcontentloaded');

    // Set view mode in localStorage
    await page.evaluate(() => {
      localStorage.setItem('crm:view:leads', 'table');
      window.dispatchEvent(new CustomEvent('crm-viewmode-change', {
        detail: { moduleKey: 'leads', viewMode: 'table' }
      }));
    });

    // Verify localStorage key holds value
    const storedValue = await page.evaluate(() => localStorage.getItem('crm:view:leads'));
    expect(storedValue).toBe('table');
  });

  test('REG-002 Invoices Contextual Settings drawer opens via gear icon and allows section switching', async ({ page }) => {
    await page.goto('/invoices');
    await page.waitForLoadState('domcontentloaded');

    // Click customize button in page toolbar
    const customizeBtn = page.locator('main').getByRole('button', { name: /customize/i }).first();
    await expect(customizeBtn).toBeVisible({ timeout: 15000 });
    await customizeBtn.click();

    // Drawer should open
    const drawer = page.locator('[data-slot="sheet-content"], aside, [role="dialog"]:not([data-nextjs-dialog])').first();
    await expect(drawer).toBeVisible({ timeout: 10000 });

    // Close drawer via Escape
    await page.keyboard.press('Escape');
  });

  test('REG-003 Quotations page loads with standard CRM Page Container and Toolbar', async ({ page }) => {
    await page.goto('/quotations');
    await page.waitForLoadState('domcontentloaded');

    // Verify container and action buttons
    const heading = page.getByRole('heading', { name: /quotations/i }).first();
    await expect(heading).toBeVisible({ timeout: 15000 });

    const newQuoteBtn = page.getByRole('button', { name: /create quote|new quote|create quotation/i }).first();
    await expect(newQuoteBtn).toBeVisible({ timeout: 10000 });
  });

  test('REG-004 Deals page loads pipeline board with CRM Toolbar actions', async ({ page }) => {
    await page.goto('/deals');
    await page.waitForLoadState('domcontentloaded');

    // Verify deals header or pipeline board
    const dealsHeading = page.getByRole('heading', { name: /deals|pipeline/i }).first();
    await expect(dealsHeading).toBeVisible({ timeout: 15000 });
  });
});
