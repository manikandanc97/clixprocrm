import { test, test as setup } from '@playwright/test';
import path from 'path';
import fs from 'fs';

const authFile = path.join(__dirname, '../playwright/.auth/user.json');

/**
 * Checks whether a stored Playwright storageState is still valid by decoding
 * the JWT `exp` claim directly from the Supabase auth cookie.
 * Returns true only if the token has > 5 minutes remaining.
 */
function isStorageStateFresh(filePath: string): boolean {
  try {
    if (!fs.existsSync(filePath)) return false;
    const content = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    if (!content?.cookies?.length) return false;

    const authCookie = content.cookies.find((c: { name: string }) =>
      c.name.includes('auth-token')
    );
    if (!authCookie?.value) return false;

    // @supabase/ssr v0.5+ may split the token into chunks (auth-token.0, auth-token.1)
    // so also look for the base .0 chunk
    const chunkCookie = content.cookies.find((c: { name: string }) =>
      c.name.includes('auth-token.0')
    );

    const targetCookie = chunkCookie || authCookie;
    const raw = targetCookie.value.startsWith('base64-')
      ? Buffer.from(targetCookie.value.slice(7), 'base64').toString('utf8')
      : decodeURIComponent(targetCookie.value);

    const parsed = JSON.parse(raw);
    const accessToken: string | undefined =
      parsed?.access_token || parsed?.accessToken;
    if (!accessToken) return false;

    const payloadB64 = accessToken.split('.')[1];
    if (!payloadB64) return false;
    const payload = JSON.parse(
      Buffer.from(payloadB64, 'base64').toString('utf8')
    );

    const nowSec = Math.floor(Date.now() / 1000);
    const remaining = typeof payload.exp === 'number' ? payload.exp - nowSec : 0;
    if (remaining > 300) {
      console.log(
        `Existing storageState valid (JWT expires in ${Math.round(remaining / 60)} min). Reusing.`
      );
      return true;
    }
    console.log(
      `Stored JWT has ${remaining}s remaining — performing fresh login.`
    );
    return false;
  } catch {
    return false;
  }
}

/**
 * E2E Test credentials.
 *
 * This account (testadmin@clixprocrm.com) is a dedicated automation user with:
 *  - NO MFA enrolled (allows simple browser login)
 *  - ADMIN role in the clixproCRM tenant
 *  - Full access to all CRM modules for smoke/regression testing
 *
 * The SuperAdmin account (superadmin@clixprocrm.com) is NOT used here because
 * it has TOTP MFA enrolled which cannot be satisfied in a headless browser.
 *
 * To re-provision this user: node scripts/create-e2e-test-user.mjs
 * To seed the Prisma DB:      npx ts-node scripts/seed-e2e-user.ts (from api/)
 */
const TEST_EMAIL    = process.env.TEST_USER_EMAIL    || 'testadmin@clixprocrm.com';
const TEST_PASSWORD = process.env.TEST_USER_PASSWORD || 'E2ETestAdmin@123456';

setup('authenticate', async ({ page }) => {
  test.setTimeout(90000);

  page.on('console', (msg) => console.log(`[BROWSER] ${msg.type()}: ${msg.text()}`));
  page.on('pageerror', (err) => console.error(`[BROWSER ERROR]`, err));
  page.on('requestfailed', (req) =>
    console.error(`[REQ FAILED] ${req.method()} ${req.url()} - ${req.failure()?.errorText}`)
  );

  // Reuse the session if the stored JWT still has > 5 min remaining.
  if (isStorageStateFresh(authFile)) {
    return;
  }

  // Ensure the auth directory exists
  const authDir = path.dirname(authFile);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  // Perform browser login — the test user has no MFA so this completes immediately
  await page.goto('/login');
  await page.waitForLoadState('domcontentloaded');
  await page.getByTestId('email-input').fill(TEST_EMAIL);
  await page.getByTestId('password-input').fill(TEST_PASSWORD);
  await page.getByTestId('login-btn').click();

  // Wait for the URL to change away from /login — the dashboard auth-loading
  // screen will appear while auth hydrates, but the URL should already be /dashboard
  await page.waitForURL(
    (url) => !url.pathname.startsWith('/login'),
    { timeout: 60000, waitUntil: 'commit' }
  );

  // Wait for auth hydration: either main is visible or we see /dashboard
  // Give it extra time since this is a cold-boot with no cached session
  await page.locator('main').first().waitFor({ state: 'visible', timeout: 60000 }).catch(async () => {
    // If main never appeared, try clicking "Try again" on the auth-loading error screen
    const tryAgain = page.getByRole('button', { name: /try again/i });
    if (await tryAgain.isVisible({ timeout: 2000 }).catch(() => false)) {
      await tryAgain.click();
      await page.locator('main').first().waitFor({ state: 'visible', timeout: 30000 }).catch(() => {});
    }
  });

  // Capture the browser cookies + localStorage into the auth file
  await page.context().storageState({ path: authFile });
  console.log(`Auth state captured to ${authFile}`);
});
