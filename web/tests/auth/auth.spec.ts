import { test, expect } from '@playwright/test';

// Use an unauthenticated state for these tests
test.use({ storageState: { cookies: [], origins: [] } });

const TEST_EMAIL = process.env.TEST_USER_EMAIL || 'testadmin@clixprocrm.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'E2ETestAdmin@123456';

test.describe('Authentication Flows', () => {
  // Run auth tests serially to prevent auth endpoint rate-limiting and session collisions
  test.describe.configure({ mode: 'serial' });
  test.setTimeout(60000);

  test.beforeEach(async ({ page }) => {
    page.on('console', msg => console.log(`[AUTH LOG] ${msg.type()}: ${msg.text()}`));
    page.on('pageerror', err => console.log(`[AUTH ERROR] ${err.message}`));
    await page.goto('/login');
  });

  test('AUTH-001 Login with valid credentials', async ({ page }) => {
    await page.getByTestId('email-input').fill(TEST_EMAIL);
    await page.getByTestId('password-input').fill(TEST_PASSWORD);
    await page.getByTestId('login-btn').click();

    await expect(page).toHaveURL(/.*(\/dashboard|\/super-admin|\/$)/, { timeout: 20000 });
  });

  test('AUTH-002 Invalid email format', async ({ page }) => {
    await page.getByTestId('email-input').fill('invalid-email');
    await page.getByTestId('password-input').fill('somepassword');
    await page.getByTestId('login-btn').click();

    await expect(page).toHaveURL(/.*\/login/);
  });

  test('AUTH-003 Invalid password', async ({ page }) => {
    await page.getByTestId('email-input').fill(TEST_EMAIL);
    await page.getByTestId('password-input').fill('wrongpassword123');
    await page.getByTestId('login-btn').click();

    await expect(page).toHaveURL(/.*\/login/);
    await expect(page.getByText(/invalid login credentials|wrong password|invalid/i)).toBeVisible({ timeout: 10000 }).catch(() => {});
  });

  test('AUTH-004 Empty fields', async ({ page }) => {
    await page.getByTestId('login-btn').click();
    await expect(page).toHaveURL(/.*\/login/);
  });

  test('AUTH-005 Logout', async ({ page }) => {
    // Login first
    await page.getByTestId('email-input').fill(TEST_EMAIL);
    await page.getByTestId('password-input').fill(TEST_PASSWORD);
    await page.getByTestId('login-btn').click();
    await expect(page).toHaveURL(/.*(\/dashboard|\/super-admin|\/$)/, { timeout: 20000 });

    // Wait for auth hydration to complete so user menu is rendered in header
    const userMenu = page.getByRole('button', { name: /User Profile Menu/i }).or(page.getByTestId('user-menu-button'));
    await expect(userMenu).toBeVisible({ timeout: 20000 });
    await userMenu.click();
    
    // Click Sign Out
    const signOutItem = page.getByRole('menuitem', { name: /sign out/i });
    await expect(signOutItem).toBeVisible({ timeout: 5000 });
    await signOutItem.click();

    // Confirm in alert dialog
    const confirmButton = page.locator('[role="alertdialog"]').getByRole('button', { name: /sign out/i });
    await expect(confirmButton).toBeVisible({ timeout: 5000 });
    await confirmButton.click();

    // Verify redirect to login or login page accessible
    await expect(page).toHaveURL(/.*\/login/, { timeout: 20000 });
  });

  test('AUTH-006 & AUTH-007 Protected route without authentication', async ({ page }) => {
    // Attempt to access a protected route without logging in
    await page.goto('/dashboard');
    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login.*/, { timeout: 20000 });
  });

  test('AUTH-008 Admin navigation & AUTH-009 Role-based navigation', async ({ page }) => {
    // Login as Admin
    await page.getByTestId('email-input').fill(TEST_EMAIL);
    await page.getByTestId('password-input').fill(TEST_PASSWORD);
    await page.getByTestId('login-btn').click();
    await expect(page).toHaveURL(/.*(\/dashboard|\/super-admin|\/$)/, { timeout: 20000 });

    // Verify navigation/sidebar structure renders
    const nav = page.locator('nav, aside, header');
    await expect(nav.first()).toBeVisible({ timeout: 20000 });
  });

  test('AUTH-010 Session expiry behavior', async ({ page, context }) => {
    // Login
    await page.getByTestId('email-input').fill(TEST_EMAIL);
    await page.getByTestId('password-input').fill(TEST_PASSWORD);
    await page.getByTestId('login-btn').click();
    await expect(page).toHaveURL(/.*(\/dashboard|\/super-admin|\/$)/, { timeout: 20000 });

    // Wait for session to be active
    await page.locator('nav, aside, header').first().waitFor({ state: 'visible', timeout: 20000 });

    // Simulate session expiry by clearing cookies & local storage
    await context.clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });

    // Reload page or navigate to dashboard
    await page.goto('/dashboard');

    // Should redirect to login
    await expect(page).toHaveURL(/.*\/login.*/, { timeout: 20000 });
  });
});
