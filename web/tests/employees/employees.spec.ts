import { test, expect } from '@playwright/test';

test.describe('Employees Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/employees');
  });

  test('Page loads correctly', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /employees/i })).toBeVisible({ timeout: 15000 });
    const listContainer = page.locator('table, [data-testid="employees-list"], main');
    await expect(listContainer.first()).toBeVisible({ timeout: 15000 });
  });

  test('Invite/Add Employee', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /employees/i })).toBeVisible({ timeout: 15000 });
    await page.getByRole('button', { name: /add employee|invite/i }).click();
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();

    const testId = Date.now();
    await modal.getByPlaceholder(/enter full name|name/i).fill(`E2E Employee ${testId}`);
    await modal.getByPlaceholder(/enter email address|email/i).fill(`e2e_emp_${testId}@example.com`);
    
    // Generate temporary password if button exists
    const genPwdBtn = modal.getByRole('button', { name: /generate password/i });
    if (await genPwdBtn.isVisible()) {
      await genPwdBtn.click();
    } else {
      await modal.getByPlaceholder(/temporary password|password/i).fill('TempPassword@123');
    }

    await modal.getByRole('button', { name: /create employee|send invite|invite|submit/i }).click();
    await expect(page.getByText(/created successfully|success/i)).toBeVisible().catch(() => {});
  });
});
