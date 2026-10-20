import { describe, it, expect } from 'vitest';
import type { CvScoreBasisRow } from '../../../types/api';
import { criterionLabel, formatPeriod, sortScoreBases, summaryLines, totalPointsLost } from '../cvScoreBasisText';

describe('cvScoreBasisText', () => {
  it('names the criteria in Norwegian and keeps an unknown key as it is', () => {
    expect(criterionLabel('projectDescriptions')).toBe('Prosjektbeskrivelser');
    expect(criterionLabel('somethingNew')).toBe('somethingNew');
  });

  /** The deductions together are what the total lost: 67.25 gives 32.75. */
  it('adds the points lost to one decimal', () => {
    const criteria = [10, 7.5, 3, 6.8, 3, 2.5].map((pointsLost, i) => ({ criterion: `c${i}`, weight: 1, score: 0, pointsLost }));

    expect(totalPointsLost(criteria)).toBe(32.8);
  });

  it('writes a period as month and year, and an ongoing one as such', () => {
    expect(formatPeriod({ from: '2025-12', to: null, ongoing: true })).toBe('12/2025 – pågående');
    expect(formatPeriod({ from: '2013-04', to: '2014-03', ongoing: false })).toBe('04/2013 – 03/2014');
    expect(formatPeriod({ from: null, to: null, ongoing: true })).toBe('? – pågående');
  });

  it('marks the counts that are gaps against the standard', () => {
    const lines = summaryLines({
      projects: 10, emptyDescription: 1, shortDescription: 6, goldRangeDescription: 1, longDescription: 3,
      withoutRoleText: 1, firstPerson: 1, withMethod: 2, withTeam: 1, withMeasurableValue: 4, withoutSkills: 0,
    });

    expect(lines.find(l => l.label === 'Uten prosjektbeskrivelse')).toEqual({ label: 'Uten prosjektbeskrivelse', value: 1, gap: true });
    expect(lines.find(l => l.label === 'Beskrivelse på 90–120 ord')?.gap).toBe(false);
  });
  it('keeps missing and invalid dates last in both directions and leaves its input unchanged', () => {
    const row = (candidateId: string, scoredAt: string | null): CvScoreBasisRow => ({ candidateId, name: candidateId,
      scorePercent: 80, stale: false, hasBreakdown: true, scoredAt });
    const rows = [row('unknown', null), row('old', '2026-10-18T11:00:00Z'),
      row('invalid', 'invalid'), row('new', '2026-10-20T11:00:00Z')];
    expect(sortScoreBases(rows, 'date', 'desc').map(r => r.candidateId)).toEqual(['new', 'old', 'invalid', 'unknown']);
    expect(sortScoreBases(rows, 'date', 'asc').map(r => r.candidateId)).toEqual(['old', 'new', 'invalid', 'unknown']);
    expect(sortScoreBases(rows, 'score', 'desc').map(r => r.candidateId)).toEqual(['new', 'old', 'invalid', 'unknown']);
    expect(rows.map(r => r.candidateId)).toEqual(['unknown', 'old', 'invalid', 'new']);
  });

});
