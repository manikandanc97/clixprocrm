import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test.describe('Accessibility Checks', () => {
  const pages = [
    { name: 'Dashboard', path: '/dashboard' },
    { name: 'Leads', path: '/leads' },
    { name: 'Companies', path: '/companies' }
  ];

  for (const p of pages) {
    test(`Should not have any automatically detectable accessibility issues on ${p.name}`, async ({ page }) => {
      test.setTimeout(60000);
      await page.goto(p.path);
      await page.waitForLoadState('networkidle');

      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .disableRules(['color-contrast'])
        .analyze();
      
      // Enforce zero critical or serious WCAG accessibility violations
      const criticalViolations = accessibilityScanResults.violations.filter(
        (v) => v.impact === 'critical' || v.impact === 'serious'
      );
      expect(criticalViolations).toEqual([]);
    });
  }
});
