import { describe, it, expect } from 'vitest';
import { formatScoredAt, scoringErrorMessage } from '../cvScoreDetailText';

describe('cvScoreDetailText', () => {
  it('says when and by which model a score was written', () => {
    const text = formatScoredAt({ scoredAt: '2026-10-18T09:30:00Z', model: 'claude-opus-5-5' });

    expect(text).toContain('claude-opus-5-5');
    expect(text).toContain('2026');
  });

  /** A score from before this was recorded has no time, and the page says so rather than guessing. */
  it('gives nothing for a score without a recorded time', () => {
    expect(formatScoredAt({ scoredAt: null, model: null })).toBeNull();
  });

  /** A refused CV is explained in the server's words, not as a failure. */
  it('uses the server message when there is one', () => {
    const refused = { response: { data: { message: 'CV-en til Vivi Elton har ingen prosjekter, arbeidserfaring eller nøkkelkvalifikasjoner å vurdere.' } } };

    expect(scoringErrorMessage(refused)).toMatch(/Vivi Elton/);
    expect(scoringErrorMessage(new Error('network'))).toBe('Scoring feilet');
  });
});
