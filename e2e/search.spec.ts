import { test, expect } from '@playwright/test';

test.describe('Consultant search', () => {
  test('loads search page and shows tabs', async ({ page }) => {
    await page.goto('/search');

    // By role: the page help under the title names both searches too, and getByText found both.
    await expect(page.getByRole('tab', { name: 'Relasjonelt søk' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Semantisk søk' })).toBeVisible();
  });
});
