import { test, expect } from '@playwright/test';

test.describe('Consultant search', () => {
  test('loads search page and shows tabs', async ({ page }) => {
    await page.goto('/search');

    await expect(page.getByText('Relasjonelt søk')).toBeVisible();
    await expect(page.getByText('Semantisk søk')).toBeVisible();
  });
});
