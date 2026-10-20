import { test, expect } from '@playwright/test';

for (const width of [390, 1280]) {
  test(`CV-score basis is readable at ${width}px and never starts a review`, async ({ page }) => {
    await page.setViewportSize({ width, height: 844 });
    const writes: string[] = [];
    page.on('request', request => { if (request.method() === 'POST') writes.push(request.url()); });
    const row = { candidateId: 'u1', name: 'Kari Nordmann', scorePercent: 75, stale: true,
      hasBreakdown: true, scoredAt: '2026-10-19T11:00:00Z', rulesStatus: 'OUTDATED', promptVersion: '2026-10-cv-review-v3', currentPromptVersion: '2026-10-cv-review-v5' };
    const metrics = { version: 1, countedOn: '2026-10-19', cvHash: 'old', profileWords: 100, keyPoints: 0,
      projects: [], recent: { projects: 0, emptyDescription: 0, shortDescription: 0, goldRangeDescription: 0,
        longDescription: 0, withoutRoleText: 0, firstPerson: 0, withMethod: 0, withTeam: 0, withMeasurableValue: 0, withoutSkills: 0 } };
    await page.route(url => url.pathname.startsWith('/api/'), route => {
      const url = new URL(route.request().url());
      if (url.pathname === '/api/admin/cv-score/basis') return route.fulfill({ json: [
        { ...row, candidateId: 'u0', name: 'Anne Berg', scorePercent: 95, scoredAt: '2026-10-18T11:00:00Z' },
        row,
        { ...row, candidateId: 'u2', name: 'Ola Hansen', scorePercent: 60, scoredAt: '2026-10-20T11:00:00Z' },
      ] });
      if (url.pathname === '/api/admin/cv-score/u1/basis') return route.fulfill({ json: { ...row,
        criteria: [{ criterion: 'projectDescriptions', weight: 2.5, score: 60, pointsLost: 10,
          justification: 'Prosjektet beskriver kunden og løsningen, men mangler forklaring på hvilken utfordring leveransen skulle løse.' }],
        calibrationNotes: ['Kundeverdi skal vurderes under ett kriterium.'], metrics,
        currentMetrics: { ...metrics, version: 2, countedOn: '2026-10-20', cvHash: 'new' } } });
      return route.fulfill({ json: {} });
    });
    await page.goto('/cv-score-grunnlag?id=u1');
    await expect(page.getByRole('heading', { name: 'Kari Nordmann' })).toBeVisible();
    await expect(page.getByText(/Lagrede tellinger fra CV-en/)).toBeVisible();
    await expect(page.getByText(/Fra dagens CV, som kan ha annet innhold/)).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
    const region = page.getByRole('region', { name: 'Kari Nordmann', exact: true });
    expect(await region.evaluate(element => ({
      previous: element.closest('tr')?.previousElementSibling?.textContent,
      next: element.closest('tr')?.nextElementSibling?.textContent,
    }))).toEqual({ previous: expect.stringContaining('Kari Nordmann'), next: expect.stringContaining('Ola Hansen') });
    const toggle = page.getByRole('button', { name: 'Kari Nordmann', exact: true });
    await toggle.focus();
    await page.keyboard.press('Enter');
    await expect(region).toHaveCount(0);
    await expect(toggle).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(region).toBeVisible();
    await page.getByRole('button', { name: 'Sorter etter dato' }).click();
    await expect(page.getByRole('table', { name: 'Vurderte konsulenter' }).locator('button[aria-expanded]'))
      .toHaveText(['Ola Hansen', 'Kari Nordmann', 'Anne Berg']);
    expect(writes).toEqual([]);
  });
}
