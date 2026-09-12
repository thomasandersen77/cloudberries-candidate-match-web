import { describe, it, expect, vi, beforeEach } from 'vitest';
import { loadCvScoreListRows } from './cvScoreService';
import apiClient from './apiClient';

vi.mock('./apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn() },
  aiScoringClient: { get: vi.fn(), post: vi.fn() }
}));
const mockedApiClient = vi.mocked(apiClient);

/**
 * The list page's rows, and how many requests it takes to build them.
 *
 * It used to call /cv-score/{id} once per candidate, ten at a time: 118 round trips on a corpus of
 * 118, after a first request that had already returned every score. The summary was the only thing
 * those calls added, and it lives in the same database row as the score.
 */
describe('cvScoreService', () => {
  beforeEach(() => vi.clearAllMocks());

  const candidates = [
    { id: 'user-a', name: 'Arild Spersrud', score: 79, summary: 'Erfaren konsulent.', birthYear: 1980 },
    { id: 'user-b', name: 'Bodil Berg', score: 84, summary: 'Sterk på data.', birthYear: 1985 },
    { id: 'user-c', name: 'Cato Dahl', birthYear: 1990 }
  ];

  it('builds every row without asking the server again', async () => {
    const rows = await loadCvScoreListRows(candidates as never);

    expect(mockedApiClient.get).not.toHaveBeenCalled();
    expect(rows.map(r => r.name)).toEqual(['Bodil Berg', 'Arild Spersrud', 'Cato Dahl']);
  });

  it('carries the summary that came with the score', async () => {
    const rows = await loadCvScoreListRows(candidates as never);

    expect(rows.find(r => r.name === 'Arild Spersrud')?.summary).toBe('Erfaren konsulent.');
  });

  /** A candidate nobody has scored is a row with no number, not a missing row. */
  it('keeps an unscored candidate in the list', async () => {
    const rows = await loadCvScoreListRows(candidates as never);

    const cato = rows.find(r => r.name === 'Cato Dahl');
    expect(cato).toBeDefined();
    expect(cato?.scorePercent).toBe(0);
    expect(cato?.summary).toBe('');
  });
});
