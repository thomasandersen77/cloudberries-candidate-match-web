import { describe, it, expect } from 'vitest';
import { formatMatchScore, formatMatchScoreSuffix, formatPercentScore, formatQualityLabel } from './matchUtils';

describe('formatMatchScore', () => {
  it('preserves one decimal place for OpenAPI 0–10 scores', () => {
    expect(formatMatchScore(8.3)).toBe('8.3');
    expect(formatMatchScore(7.5)).toBe('7.5');
    expect(formatMatchScore(7)).toBe('7.0');
  });

  it('returns dash when score is missing or invalid', () => {
    expect(formatMatchScore(undefined)).toBe('–');
    expect(formatMatchScore(null)).toBe('–');
    expect(formatMatchScore(Number.NaN)).toBe('–');
  });
});

describe('formatMatchScoreSuffix', () => {
  // The scale is part of the label. The matches page shows the preview's ranking as a percentage
  // right above these rows, so a bare "score 5.8" next to "rang 61 %" reads as the worse of the
  // two when it is the more favourable.
  it('formats AI match line suffix with its scale', () => {
    expect(formatMatchScoreSuffix(8.3)).toBe(' • score 8.3 / 10');
    expect(formatMatchScoreSuffix(undefined)).toBe('');
  });
});

describe('formatPercentScore', () => {
  it('rounds a 0..1 signal to a whole percentage with a Norwegian space', () => {
    expect(formatPercentScore(0.904)).toBe('90 %');
    expect(formatPercentScore(0)).toBe('0 %');
  });

  it('returns dash when the signal is missing', () => {
    expect(formatPercentScore(undefined)).toBe('–');
    expect(formatPercentScore(null)).toBe('–');
  });
});

describe('formatQualityLabel', () => {
  it('shows the quality and the presented score it led to', () => {
    expect(formatQualityLabel({ score: 8.3, presentedScore: 8.0, cvQualityScore: 66 })).toBe(' · CV 66 → 8,0');
    expect(formatQualityLabel({ score: 7.1, presentedScore: 7.1, cvQualityScore: 71 })).toBe(' · CV 71');
  });

  it('is empty without a presented score or a quality', () => {
    expect(formatQualityLabel({ score: 8.3 })).toBe('');
    expect(formatQualityLabel({ score: 8.3, presentedScore: 8.3, cvQualityScore: null })).toBe('');
  });
});
