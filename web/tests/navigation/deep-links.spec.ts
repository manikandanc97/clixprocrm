import { test, expect } from '@playwright/test';

test.describe('URL Deep-Link and Query Parameter States', () => {
  test.describe.configure({ mode: 'serial' });

  test('DL-001 Tasks with ?new=true opens modal and performs URL parameter cleanup', async ({ page }) => {
    await page.goto('/tasks?new=true');
    await page.waitForLoadState('domcontentloaded');

    // Verify task creation modal heading
    const heading = page.getByRole('heading', { name: /create task|new task|task/i }).first();
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Verify URL parameter cleanup occurred (?new=true removed from active URL bar)
    expect(page.url()).not.toContain('new=true');

    // Close modal via Escape
    await page.keyboard.press('Escape');
  });

  test('DL-002 Invoices with ?new=true opens modal or creation drawer', async ({ page }) => {
    await page.goto('/invoices?new=true');
    await page.waitForLoadState('domcontentloaded');

    // Verify invoice creation dialog heading
    const heading = page.getByRole('heading', { name: /create.*invoice|new invoice/i }).first();
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Verify URL parameter cleanup occurred
    expect(page.url()).not.toContain('new=true');
    await page.keyboard.press('Escape');
  });

  test('DL-003 Employees with ?new=true opens Invite Employee modal', async ({ page }) => {
    await page.goto('/employees?new=true');
    await page.waitForLoadState('domcontentloaded');

    // Verify employee invite modal heading
    const heading = page.getByRole('heading', { name: /invite|add.*employee/i }).first();
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Verify URL parameter cleanup occurred
    expect(page.url()).not.toContain('new=true');
    await page.keyboard.press('Escape');
  });

  test('DL-004 Quotations with ?new=true opens quotation form modal', async ({ page }) => {
    await page.goto('/quotations?new=true');
    await page.waitForLoadState('domcontentloaded');

    // Verify quotation modal heading
    const heading = page.getByRole('heading', { name: /create.*quotation|new quotation|quotation/i }).first();
    await expect(heading).toBeVisible({ timeout: 15000 });

    // Verify URL parameter cleanup occurred
    expect(page.url()).not.toContain('new=true');
    await page.keyboard.press('Escape');
  });

  test('DL-005 Deals with ?customize=true opens contextual customization drawer', async ({ page }) => {
    await page.goto('/deals?customize=true');
    await page.waitForLoadState('domcontentloaded');

    // Verify contextual customization drawer or sheet is open
    const drawer = page.locator('[data-slot="sheet-content"], [data-slot="drawer-content"], aside, [role="dialog"]:not([data-nextjs-dialog])').first();
    await expect(drawer).toBeVisible({ timeout: 15000 });
  });

  test('DL-006 Upgrade URL loads plan tiers or requires security assurance without error', async ({ page }) => {
    await page.goto('/upgrade');
    await page.waitForLoadState('domcontentloaded');

    // Verify heading or plan selection cards or enterprise MFA challenge
    const heading = page.getByRole('heading', { name: /upgrade|plan|pricing/i }).first();
    const mfaPrompt = page.getByRole('heading', { name: /two-factor|mfa/i }).first();
    await expect(heading.or(mfaPrompt)).toBeVisible({ timeout: 15000 });
  });
});
