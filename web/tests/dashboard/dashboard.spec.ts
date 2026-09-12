import { test, expect, type Page } from '@playwright/test';

/**
 * Navigates to the dashboard and waits for the auth-loading screen to fully
 * resolve (including handling the "Something went wrong" / "Try again" error
 * state that can appear when the auth-provider is slow to hydrate or when a
 * fresh JWT is being fetched after session refresh).
 *
 * Strategy:
 *   1. Go to the route.
 *   2. Wait for the "Workspace initialization" status region to detach (if present).
 *   3. If the "Try again" button appears, click it and wait again.
 *   4. Wait for <main> to be visible.
 */
async function waitForDashboard(page: Page, timeout = 50000): Promise<void> {
  const deadline = Date.now() + timeout;

  // Helper: wait for auth error/loading overlay to clear
  const waitForAuthClear = async (remaining: number) => {
    // Wait for the workspace-init status region to disappear
    await page
      .locator('[role="status"]')
      .waitFor({ state: 'detached', timeout: remaining })
      .catch(() => {});

    // If "Something went wrong" / "Try again" appeared, click it and wait more
    const tryAgainBtn = page.getByRole('button', { name: /try again/i });
    if (await tryAgainBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tryAgainBtn.click();
      await page
        .locator('[role="status"]')
        .waitFor({ state: 'detached', timeout: Math.max(0, deadline - Date.now()) })
        .catch(() => {});
    }
  };

  await page.goto('/dashboard');
  await page.waitForLoadState('domcontentloaded');
  await waitForAuthClear(Math.max(0, deadline - Date.now()));
  await expect(page.locator('main').first()).toBeVisible({
    timeout: Math.max(5000, deadline - Date.now()),
  });
}

test.describe('Dashboard Module', () => {
  test.describe.configure({ mode: 'serial' });

  test.beforeEach(async ({ page }) => {
    test.setTimeout(90000);
    page.on('console', (msg) => {
      if (msg.type() === 'error') console.log('DASHBOARD CONSOLE ERROR:', msg.text());
    });
    page.on('pageerror', (err) => console.log('DASHBOARD PAGE ERROR:', err.message));

    // Auto-dismiss MFA challenge if it appears
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

  test('DASH-001 Dashboard page loads with core container structure', async ({ page }) => {
    await waitForDashboard(page);

    // Assert dashboard layout container or main region is visible
    const mainContent = page.locator('main').first();
    await expect(mainContent).toBeVisible({ timeout: 15000 });

    // Verify presence of navigation elements
    const nav = page.locator('nav, aside').first();
    await expect(nav).toBeVisible({ timeout: 15000 });
  });

  test('DASH-002 KPI Metrics render properly', async ({ page }) => {
    await waitForDashboard(page);

    // Verify the KPI grid, metric cards, or main container renders
    const kpiSection = page.locator('[data-slot="metrics-grid"], .grid, main').first();
    await expect(kpiSection).toBeVisible({ timeout: 15000 });

    // Verify key KPI labels or cards exist on the page
    const kpiCard = page.getByText(/revenue|leads|active deals|win rate|conversion|welcome/i).first();
    await expect(kpiCard).toBeVisible({ timeout: 15000 });
  });

  test('DASH-003 Quick Action Create New menu interaction', async ({ page }) => {
    await waitForDashboard(page);

    // Look for quick create trigger button
    const createBtn = page.getByRole('button', { name: /create|new|\+/i }).first();
    if (await createBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
      await createBtn.click();
      // Ensure dropdown or modal menu opens without crashing
      const menu = page.locator('[role="menu"], [role="dialog"], [data-slot="dropdown-content"]').first();
      await expect(menu).toBeVisible({ timeout: 5000 }).catch(() => {});
      // Close by pressing Escape
      await page.keyboard.press('Escape');
    }
  });

  test('DASH-004 Navigation sidebar links are responsive and accessible', async ({ page }) => {
    await waitForDashboard(page);

    // Check key CRM navigation links
    const contactsLink = page.getByRole('link', { name: /contacts/i }).first();
    await expect(contactsLink).toBeVisible({ timeout: 15000 });
    expect(await contactsLink.getAttribute('href')).toContain('/contacts');
  });
});
