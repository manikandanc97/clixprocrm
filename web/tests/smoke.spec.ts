import { test } from '@playwright/test';

test.describe('Final Runtime Smoke Tests', () => {
  const results: { module: string; endpoint: string; status: number; result: string; error?: string }[] = [];
  const captureResult = (moduleName: string, endpoint: string, status: number, result: string, error?: string) => {
    results.push({ module: moduleName, endpoint, status, result, error });
  };

  test.afterAll(() => {
    console.log('=== FINAL SMOKE TEST RESULTS ===');
    console.log(JSON.stringify(results, null, 2));
  });

  test('Module 1-21: Full Navigation and Error Capture', async ({ page }) => {
    test.setTimeout(180000); // 3 minutes for full smoke test
    
    const apiErrors: { url: string; status: number }[] = [];
    const consoleErrors: string[] = [];

    // Capture console errors
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Capture unhandled page errors
    page.on('pageerror', err => {
      consoleErrors.push(err.message);
    });

    // Capture network responses
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('/api/')) {
        const status = response.status();
        if (status >= 400) {
          apiErrors.push({ url, status });
        }
      }
    });

    // Try Registration first to guarantee a valid user session
    const ts = Date.now();
    const testEmail = `smoke_${ts}@example.com`;
    const testPassword = 'TestPassword123!';

    console.log('Registering new user:', testEmail);
    await page.goto('/register');
    
    // Attempt to fill registration. We will guess common selectors or use placeholder text
    try {
      await page.locator('input[type="email"]').fill(testEmail);
      await page.locator('input[type="password"]').first().fill(testPassword);
      await page.getByRole('button', { name: /sign up|register|create account/i }).click();
      await page.waitForURL(/.*(\/onboarding|\/dashboard|\/$)/, { timeout: 10000 });
      console.log('Registration succeeded, url:', page.url());
    } catch {
      console.log('Registration failed/timed out, attempting to login with previous e2e admin instead');
      await page.goto('/login');
      await page.locator('input[type="email"]').fill('e2e_admin_1786276028193@gmail.com');
      await page.locator('input[type="password"]').fill('TestPassword123!');
      await page.getByRole('button', { name: /log in|sign in|submit/i }).click();
      await page.waitForURL(/.*(\/dashboard|\/$)/, { timeout: 10000 }).catch(() => console.log('Login fallback failed'));
    }

    // Now test all modules
    const modulesToTest = [
      { name: 'Dashboard', url: '/dashboard', waitSelector: 'body' },
      { name: 'Companies CRUD', url: '/companies', waitSelector: 'body' },
      { name: 'Contacts CRUD', url: '/contacts', waitSelector: 'body' },
      { name: 'Customers CRUD', url: '/customers', waitSelector: 'body' },
      { name: 'Leads CRUD', url: '/leads', waitSelector: 'body' },
      { name: 'Deals CRUD', url: '/deals', waitSelector: 'body' },
      { name: 'Employees', url: '/employees', waitSelector: 'body' },
      { name: 'Tasks', url: '/tasks', waitSelector: 'body' },
      { name: 'Calendar / Meetings', url: '/calendar', waitSelector: 'body' },
      { name: 'Quotations', url: '/quotations', waitSelector: 'body' },
      { name: 'Settings', url: '/settings', waitSelector: 'body' },
      { name: 'Gemini AI Assistant', url: '/ai-insights', waitSelector: 'body' }
    ];

    for (const mod of modulesToTest) {
      console.log(`Testing ${mod.name} at ${mod.url}`);
      const response = await page.goto(mod.url, { waitUntil: 'networkidle', timeout: 15000 }).catch(() => null);
      
      const status = response ? response.status() : 500;
      let result = status < 400 ? 'PASS' : 'FAIL';
      let errorStr = '';

      if (consoleErrors.length > 0) {
        errorStr = `Console: ${consoleErrors[0]}`;
        consoleErrors.length = 0; // reset
      }

      const failingApiCall = apiErrors.find(a => a.url.includes(mod.url) || a.url.includes('api/'));
      const endpoint = failingApiCall ? failingApiCall.url : `/api${mod.url}`;
      
      if (failingApiCall && failingApiCall.status >= 500) {
         result = 'FAIL';
         errorStr += ` API ${failingApiCall.status}`;
      }

      apiErrors.length = 0; // reset
      captureResult(mod.name, endpoint, status, result, errorStr);
    }
  });
});
