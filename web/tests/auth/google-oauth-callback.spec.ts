import { test, expect } from '@playwright/test';

test.describe('Google OAuth Callback Route', () => {
  test('Callback route serves error state and close button on auth error without navigating to dashboard', async ({ page }) => {
    await page.goto('/api/auth/callback?error=access_denied&error_description=User+cancelled');
    
    await expect(page).toHaveTitle(/ClixProCRM Authentication/);
    await expect(page.getByRole('heading', { name: /Authentication Failed/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Close Window/i })).toBeVisible();
    // Ensure URL remains on the callback route and never redirects to dashboard
    expect(page.url()).toContain('/api/auth/callback');
  });

  test('Callback route handles direct navigation with no code gracefully', async ({ page }) => {
    await page.goto('/api/auth/callback');

    await expect(page).toHaveTitle(/ClixProCRM Authentication/);
    await expect(page.getByRole('heading', { name: /Authentication Failed/i })).toBeVisible();
    await expect(page.getByText(/No authentication code received/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Close Window/i })).toBeVisible();
    expect(page.url()).toContain('/api/auth/callback');
  });
});
