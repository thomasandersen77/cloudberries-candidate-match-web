import { describe, expect, it } from 'vitest';
import { compareCvScoreRowsDesc, normalizeScorePercent, sortCvScoreRows, type CvScoreListRow } from './cvScoreSort';

const row = (name: string, scorePercent: number): CvScoreListRow => ({
  id: name,
  name,
  scorePercent,
  summary: '',
});

describe('normalizeScorePercent', () => {
  it('coerces strings and clamps to 0–100', () => {
    expect(normalizeScorePercent('85')).toBe(85);
    expect(normalizeScorePercent(150)).toBe(100);
    expect(normalizeScorePercent('n/a')).toBe(0);
  });
});

describe('sortCvScoreRows', () => {
  it('orders highest score first', () => {
    const sorted = sortCvScoreRows([
      row('Low', 10),
      row('High', 85),
      row('Mid', 42),
    ]);
    expect(sorted.map((r) => r.name)).toEqual(['High', 'Mid', 'Low']);
  });

  it('breaks ties by name', () => {
    const sorted = sortCvScoreRows([row('Zara', 50), row('Anna', 50)]);
    expect(sorted.map((r) => r.name)).toEqual(['Anna', 'Zara']);
  });

  it('compares coerced string scores numerically', () => {
    expect(normalizeScorePercent('10')).toBeGreaterThan(normalizeScorePercent('9'));
    expect(compareCvScoreRowsDesc(row('A', 9), row('B', 10))).toBeGreaterThan(0);
  });
});
