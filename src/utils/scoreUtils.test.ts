import { describe, it, expect } from 'vitest';
import { getActiveQualityScore, compareByQualityThenName } from './scoreUtils';

describe('getActiveQualityScore', () => {
  it('reads the top-level qualityScore the consultant endpoints return', () => {
    // Consultant responses carry the score at the top level. Reading only `cvs` meant the
    // quality badge never rendered, because the API returns `cvData`, not `cvs`.
    expect(getActiveQualityScore({ qualityScore: 96 })).toBe(96);
  });

  it('falls back to cvData when the top level has no score', () => {
    expect(getActiveQualityScore({ cvData: { active: true, qualityScore: 80 } })).toBe(80);
  });

  it('still supports the legacy cvs array', () => {
    expect(
      getActiveQualityScore({
        cvs: [
          { active: false, qualityScore: 10 },
          { active: true, qualityScore: 70 },
        ],
      }),
    ).toBe(70);
  });

  it('prefers the active CV over an inactive one', () => {
    expect(
      getActiveQualityScore({
        cvs: [
          { active: false, qualityScore: 20 },
          { active: true, qualityScore: 90 },
        ],
      }),
    ).toBe(90);
  });

  it('falls back to any scored CV when none is marked active', () => {
    expect(getActiveQualityScore({ cvs: [{ qualityScore: 55 }] })).toBe(55);
  });

  it('returns null when nothing carries a score', () => {
    expect(getActiveQualityScore({})).toBeNull();
    expect(getActiveQualityScore({ qualityScore: null })).toBeNull();
    expect(getActiveQualityScore({ cvs: [{ active: true, qualityScore: null }] })).toBeNull();
  });

  it('clamps out-of-range values to 0-100', () => {
    expect(getActiveQualityScore({ qualityScore: 140 })).toBe(100);
    expect(getActiveQualityScore({ qualityScore: -5 })).toBe(0);
  });
});

describe('compareByQualityThenName', () => {
  it('sorts by quality descending, then by name', () => {
    const list = [
      { name: 'Bjørn', qualityScore: 60 },
      { name: 'Anne', qualityScore: 90 },
      { name: 'Cecilie', qualityScore: 90 },
    ];
    expect([...list].sort(compareByQualityThenName).map((c) => c.name)).toEqual([
      'Anne',
      'Cecilie',
      'Bjørn',
    ]);
  });

  it('puts consultants without a score last', () => {
    const list = [
      { name: 'Uten score' },
      { name: 'Med score', qualityScore: 40 },
    ];
    expect([...list].sort(compareByQualityThenName).map((c) => c.name)).toEqual([
      'Med score',
      'Uten score',
    ]);
  });
});
