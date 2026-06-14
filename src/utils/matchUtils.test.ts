import { describe, it, expect } from 'vitest';
import {
  formatMatchScore,
  formatMatchScoreSuffix,
  formatLegacyMatchScoreLabel,
  normalizeMatchScoreForVisualization,
} from './matchUtils';

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
  it('formats AI match line suffix', () => {
    expect(formatMatchScoreSuffix(8.3)).toBe(' • score 8.3');
    expect(formatMatchScoreSuffix(undefined)).toBe('');
  });
});

describe('formatLegacyMatchScoreLabel', () => {
  it('uses decimal score form for 0–10 scale', () => {
    expect(formatLegacyMatchScoreLabel(8.3)).toBe('score 8.3');
  });

  it('uses percent for 0–100 legacy integers', () => {
    expect(formatLegacyMatchScoreLabel(83)).toBe('83%');
  });

  it('uses percent for 0–1 fractional legacy values', () => {
    expect(formatLegacyMatchScoreLabel(0.87)).toBe('87.0%');
  });
});

describe('normalizeMatchScoreForVisualization', () => {
  it('maps 0–10 scores to 0–1', () => {
    expect(normalizeMatchScoreForVisualization(8.3)).toBeCloseTo(0.83);
  });
});
