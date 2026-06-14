import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./apiClient', () => {
  return {
    default: { get: vi.fn(), post: vi.fn(), put: vi.fn() },
    aiScoringClient: { get: vi.fn(), post: vi.fn() },
  };
});

import apiClient, { aiScoringClient } from './apiClient';
import { runScoreForCandidate, recalculateScoreForCandidate, runScoreForAll } from './cvScoreService';
import { reAnalyzeRequest, runRequestMatches } from './matchesRequestsService';
import { recalculateMatches } from './newMatchesService';
import { analyzeProjectRequest, uploadProjectRequest } from './projectRequestsService';

const mockedAi = aiScoringClient as unknown as { post: ReturnType<typeof vi.fn> };
const mockedApi = apiClient as unknown as { post: ReturnType<typeof vi.fn> };

function lastParams(mock: ReturnType<typeof vi.fn>): Record<string, unknown> | undefined {
  const call = mock.mock.calls[mock.mock.calls.length - 1];
  const config = call?.[2] as { params?: Record<string, unknown> } | undefined;
  return config?.params;
}

describe('useHighestQualityModel parameter', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedAi.post.mockResolvedValue({ data: {} });
    mockedApi.post.mockResolvedValue({
      data: {
        id: 1,
        customerName: 'Test',
        originalFilename: 't.pdf',
        summary: 's',
        mustRequirements: [],
        shouldRequirements: [],
      },
    });
  });

  describe('cv-score: score single candidate', () => {
    it('omits the flag when toggle is off (no opts)', async () => {
      await runScoreForCandidate('c1');
      expect(lastParams(mockedAi.post)?.useHighestQualityModel).toBeUndefined();
    });

    it('omits the flag when toggle is explicitly off', async () => {
      await runScoreForCandidate('c1', { useHighestQualityModel: false });
      expect(lastParams(mockedAi.post)?.useHighestQualityModel).toBeUndefined();
    });

    it('sends useHighestQualityModel=true when toggle is on', async () => {
      await runScoreForCandidate('c1', { useHighestQualityModel: true });
      expect(lastParams(mockedAi.post)).toMatchObject({ useHighestQualityModel: 'true' });
    });
  });

  describe('cv-score: recalculate single candidate', () => {
    it('omits the flag when off', async () => {
      await recalculateScoreForCandidate('c1', { useHighestQualityModel: false });
      expect(lastParams(mockedAi.post)?.useHighestQualityModel).toBeUndefined();
    });

    it('sends true when on', async () => {
      await recalculateScoreForCandidate('c1', { useHighestQualityModel: true });
      expect(lastParams(mockedAi.post)).toMatchObject({ useHighestQualityModel: 'true' });
    });
  });

  describe('cv-score: score all', () => {
    it('sends true when on', async () => {
      await runScoreForAll({ useHighestQualityModel: true });
      expect(lastParams(mockedAi.post)).toMatchObject({ useHighestQualityModel: 'true' });
    });
  });

  describe('matches: re-analyze', () => {
    it('omits the flag when off', async () => {
      await reAnalyzeRequest(1, { useHighestQualityModel: false });
      expect(lastParams(mockedAi.post)?.useHighestQualityModel).toBeUndefined();
    });

    it('sends true when on', async () => {
      await reAnalyzeRequest(1, { useHighestQualityModel: true });
      expect(lastParams(mockedAi.post)).toMatchObject({ useHighestQualityModel: 'true' });
    });
  });

  describe('matches: run', () => {
    it('sends limit and cvWeightPercent without quality flag by default', async () => {
      await runRequestMatches(11, { limit: 10, cvWeightPercent: 60 });
      expect(lastParams(mockedAi.post)).toMatchObject({ limit: '10', cvWeightPercent: '60' });
      expect(lastParams(mockedAi.post)?.useHighestQualityModel).toBeUndefined();
    });

    it('sends useHighestQualityModel when selected', async () => {
      await runRequestMatches(11, { limit: 10, cvWeightPercent: 60, useHighestQualityModel: true });
      expect(lastParams(mockedAi.post)).toMatchObject({
        limit: '10',
        cvWeightPercent: '60',
        useHighestQualityModel: 'true',
      });
    });
  });

  describe('matches: recalculate (async)', () => {
    it('omits the flag when off', async () => {
      await recalculateMatches(1, { useHighestQualityModel: false });
      expect(lastParams(mockedAi.post)?.useHighestQualityModel).toBeUndefined();
    });

    it('sends true when on', async () => {
      await recalculateMatches(1, { useHighestQualityModel: true });
      expect(lastParams(mockedAi.post)).toMatchObject({ useHighestQualityModel: 'true' });
    });
  });

  describe('project requests: analyze', () => {
    it('omits the flag when off', async () => {
      await analyzeProjectRequest(1, { useHighestQualityModel: false });
      expect(lastParams(mockedAi.post)?.useHighestQualityModel).toBeUndefined();
    });

    it('sends true when on', async () => {
      await analyzeProjectRequest(1, { useHighestQualityModel: true });
      expect(lastParams(mockedAi.post)).toMatchObject({ useHighestQualityModel: 'true' });
    });
  });

  describe('project requests: upload', () => {
    it('omits the flag when off', async () => {
      const file = new File(['pdf'], 'test.pdf', { type: 'application/pdf' });
      await uploadProjectRequest(file, { useHighestQualityModel: false });
      expect(lastParams(mockedApi.post)?.useHighestQualityModel).toBeUndefined();
    });

    it('sends true when on', async () => {
      const file = new File(['pdf'], 'test.pdf', { type: 'application/pdf' });
      await uploadProjectRequest(file, { useHighestQualityModel: true });
      expect(lastParams(mockedApi.post)).toMatchObject({ useHighestQualityModel: 'true' });
    });
  });
});
