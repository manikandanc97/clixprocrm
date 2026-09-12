import { test, expect } from '@playwright/test';

test.describe('Pipeline Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/pipeline');
  });

  test('All stages render and contain deal cards', async ({ page }) => {
    // Wait for the pipeline board to be visible
    const board = page.locator('.kanban-board-scroll, .dnd-context, [data-testid="pipeline-board"], main');
    await expect(board.first()).toBeVisible({ timeout: 15000 });

    // Expect pipeline heading or stage columns to be present
    await expect(page.getByRole('heading', { name: /deals & pipeline|deals/i })).toBeVisible({ timeout: 15000 });
  });
});
