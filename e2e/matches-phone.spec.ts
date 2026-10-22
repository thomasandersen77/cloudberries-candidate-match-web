import { test, expect } from '@playwright/test';

/**
 * The request list on a phone, against the running app and backend.
 *
 * At 390 px the list was 450 px wide: the coverage label stood on one line beside the open arrow
 * and pushed every card sideways. Filter chips were 26 px high and buttons 39 to 41, under the
 * 44 px a thumb needs. Vitest cannot see either; jsdom has no layout and no pointer media query.
 */
test.describe('Request list on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

  test('fits the screen, and every control on it is a thumb-sized target', async ({ page }) => {
    await page.goto('/matches');
    await expect(page.getByRole('heading', { name: 'Matcher' })).toBeVisible();
    // Wait for the cards, so the width measured is the list's and not the loading spinner's.
    await expect(page.getByRole('button', { name: 'Åpne' }).first()).toBeVisible();

    const width = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(width).toBeLessThanOrEqual(390);

    const small = await page.evaluate(() =>
      [...document.querySelectorAll('main button, main a[href], main [role=button]')]
        .map((e) => ({ label: (e.getAttribute('aria-label') || e.textContent || '').trim().slice(0, 30), box: e.getBoundingClientRect() }))
        .filter(({ box }) => box.width > 0 && box.height > 0 && box.height < 44)
        .map(({ label, box }) => `${label} ${Math.round(box.height)}px`),
    );
    expect(small, small.join(', ')).toEqual([]);
  });
});
