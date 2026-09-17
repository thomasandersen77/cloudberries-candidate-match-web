import { test, expect } from '@playwright/test';

/**
 * The front page on a phone.
 *
 * The assistant's explanation used to stand open inside the assistant card, and on a 390 px wide
 * screen it pushed the first module card, Konsulenter, to 2290 px: almost three screens down before
 * a reader saw that the app has anything but an assistant. Vitest cannot see this, because MUI's
 * breakpoints become media queries jsdom does not evaluate and every bounding box there is zero, so
 * the requirement lives here, against a real layout at the size of an ordinary phone.
 */
test.describe('Front page on a phone', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  /**
   * Two lines, both measured against the layout the phone actually gets. The way into the
   * assistant, which is the page's one action, is on the first screen. The first module card is
   * within a thumb's scroll of it, a screen and a half; it was at 2290 px, and getting it onto the
   * first screen as well would mean cutting the hero on phones, which is a decision about content
   * and not about layout.
   */
  test('puts the way into the assistant on the first screen, and the modules within a scroll', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { name: 'Assistent', exact: true })).toBeVisible();

    const viewport = page.viewportSize()!;
    const cta = await page.getByRole('link', { name: 'Åpne assistenten' }).boundingBox();
    const konsulenter = await page.getByRole('heading', { name: 'Konsulenter' }).boundingBox();
    // For the record when this fails.
    console.log(`Åpne assistenten y=${cta?.y}, Konsulenter y=${konsulenter?.y}, viewport=${viewport.height}`);

    expect(cta).not.toBeNull();
    expect(cta!.y + cta!.height).toBeLessThan(viewport.height);
    expect(konsulenter).not.toBeNull();
    expect(konsulenter!.y).toBeLessThan(viewport.height * 1.5);
  });

  test('keeps the explanation reachable behind its own link', async ({ page }) => {
    await page.goto('/');

    const toggle = page.getByRole('button', { name: 'Hvordan fungerer dette?' });
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await expect(page.getByText('Vi slår opp først')).toHaveCount(0);

    await toggle.click();

    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(page.getByText('Vi slår opp først')).toBeVisible();
    // Focus stays where the reader left it.
    await expect(toggle).toBeFocused();
  });
});
