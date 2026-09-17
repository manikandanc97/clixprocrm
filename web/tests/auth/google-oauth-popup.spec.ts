import { test, expect } from '@playwright/test';

test.describe('Google OAuth Popup Flow', () => {
  test.use({ storageState: { cookies: [], origins: [] } });

  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  test('Clicking Continue with Google opens OAuth popup window and keeps login page open', async ({ page }) => {
    // Intercept Google OAuth initialization or capture popup
    const popupPromise = page.waitForEvent('popup');
    
    const googleButton = page.getByRole('button', { name: /continue with google|connecting to google\.\.\./i });
    await expect(googleButton).toBeVisible();
    await googleButton.click();

    const popup = await popupPromise;
    expect(popup).toBeTruthy();

    // Verify the main page did NOT redirect to Google and remains on /login
    expect(page.url()).toContain('/login');

    // Close the popup to simulate user cancellation
    await popup.close();

    // Verify main page still remains active and button resets from loading state
    await expect(googleButton).toBeEnabled({ timeout: 10000 });
  });
});
