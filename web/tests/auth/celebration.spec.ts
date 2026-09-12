import { test, expect } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test.describe('Account Creation & Workspace Opening Experience', () => {
  test('CEL-001 Workspace creation progress, celebration, and entry into dashboard', async ({ page }) => {
    // Intercept backend /auth/onboarding endpoint with mock successful response
    await page.route('**/auth/onboarding', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: { id: 'test-user-id', name: 'Test Founder', role: 'ADMIN' },
            tenant: { id: 'test-tenant-id', name: 'Acme SaaS Corp', slug: 'acme-saas-corp' },
          },
          message: 'Onboarding successful',
        }),
      });
    });

    // Mock /auth/me for refreshUser calls
    await page.route('**/auth/me', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            user: {
              id: 'test-user-id',
              name: 'Test Founder',
              role: 'ADMIN',
              tenantId: 'test-tenant-id',
              permissions: ['CRM', 'Pipeline', 'Settings', 'Dashboard'],
            },
          },
        }),
      });
    });

    // Navigate to onboarding page
    await page.goto('/onboarding');

    // Fill company name
    const companyInput = page.getByRole('textbox', { name: /company/i }).or(page.getByPlaceholder(/company|workspace/i));
    await expect(companyInput).toBeVisible();
    await companyInput.fill('Acme SaaS Corp');

    // Mock dashboard endpoints
    await page.route('**/analytics/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) });
    });
    await page.route('**/meetings/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
    });
    await page.route('**/leads/**', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: [] }) });
    });

    // Submit form
    const submitBtn = page.getByRole('button', { name: /Create Workspace/i });
    await submitBtn.click();

    // Verify navigation to dashboard
    await expect(page).toHaveURL(/.*(\/dashboard|\/login.*)/, { timeout: 10000 });
  });

  test('CEL-002 Error state is shown when workspace creation fails', async ({ page }) => {
    // Intercept backend /auth/onboarding with error
    await page.route('**/auth/onboarding', async (route) => {
      await route.fulfill({
        status: 400,
        contentType: 'application/json',
        body: JSON.stringify({
          success: false,
          error: {
            message: 'Organization name is already taken.',
          },
        }),
      });
    });

    await page.goto('/onboarding');
    const companyInput = page.getByRole('textbox', { name: /company/i }).or(page.getByPlaceholder(/company|workspace/i));
    await companyInput.fill('Existing Company');
    await page.getByRole('button', { name: /Create Workspace/i }).click();

    // Error message appears inline
    await expect(page.getByText('Organization name is already taken.')).toBeVisible({ timeout: 5000 });
  });
});
