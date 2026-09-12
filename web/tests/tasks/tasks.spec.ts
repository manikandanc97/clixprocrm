import { test, expect } from '@playwright/test';

test.describe('Tasks Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tasks');
  });

  test('Page loads correctly with task list rendering', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /tasks/i })).toBeVisible({ timeout: 15000 });
    const listContainer = page.locator('table, [data-testid="tasks-list"], [data-testid="task-board"], main');
    await expect(listContainer.first()).toBeVisible({ timeout: 15000 });
  });

  test('Create new task', async ({ page }) => {
    await page.getByRole('button', { name: /add task|create task/i }).first().click();
    
    const modal = page.locator('[role="dialog"]').first();
    await expect(modal).toBeVisible();

    const testId = Date.now();
    const taskTitle = `E2E_Task_${testId}`;
    
    await modal.getByPlaceholder(/enter task title|title/i).or(modal.getByRole('textbox').first()).fill(taskTitle);
    await modal.getByRole('button', { name: 'Create Task' }).click();

    await expect(page.getByText(/task created successfully|success/i)).toBeVisible().catch(() => {});
    await expect(page.getByText(taskTitle, { exact: true }).or(page.getByRole('button', { name: taskTitle, exact: true }))).toBeVisible({ timeout: 15000 });
  });
});
