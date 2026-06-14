import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('axios', async () => {
  const actual = await vi.importActual<typeof import('axios')>('axios');
  return {
    ...actual,
    isAxiosError: (error: unknown) =>
      !!error && typeof error === 'object' && 'response' in (error as object),
  };
});

vi.mock('../services/apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  aiScoringClient: { get: vi.fn(), post: vi.fn() },
}));

vi.mock('../services/matchesRequestsService', () => ({
  previewRequestMatches: vi.fn().mockRejectedValue({ response: { status: 404 } }),
  runRequestMatches: vi.fn().mockRejectedValue({ response: { status: 404 } }),
  reAnalyzeRequest: vi.fn().mockResolvedValue([{ userId: '1', name: 'A', cvId: 'c', score: 1 }]),
}));

vi.mock('../services/newMatchesService', () => ({
  getMatchStatus: vi.fn().mockResolvedValue({ status: 'COMPLETED' }),
}));

vi.mock('../services/projectMatchesService', () => ({
  projectMatchesService: {
    getTopMatches: vi.fn().mockResolvedValue(null),
  },
}));

vi.mock('../services/projectRequestsService', () => ({
  uploadProjectRequest: vi.fn(),
  getProjectRequestById: vi.fn(),
}));

import apiClient, { aiScoringClient } from '../services/apiClient';
import {
  previewProjectMatches,
  runProjectMatching,
  getProjectMatchResults,
} from './matchingApi';
import { reAnalyzeRequest } from '../services/matchesRequestsService';

const mockedApi = apiClient as unknown as { get: ReturnType<typeof vi.fn> };
const mockedAi = aiScoringClient as unknown as { post: ReturnType<typeof vi.fn> };

describe('matchingApi', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('previewProjectMatches returns null when endpoint missing (404)', async () => {
    mockedApi.get.mockRejectedValue({ response: { status: 404 }, isAxiosError: true });
    const result = await previewProjectMatches(1, { limit: 5 });
    expect(result).toBeNull();
  });

  it('runProjectMatching falls back to re-analyze without quality flag by default', async () => {
    mockedAi.post.mockRejectedValue({ response: { status: 404 } });
    await runProjectMatching(1, { limit: 5 });
    expect(reAnalyzeRequest).toHaveBeenCalledWith(1, {
      useHighestQualityModel: undefined,
      cvWeightPercent: undefined,
    });
  });

  it('runProjectMatching sends useHighestQualityModel when selected', async () => {
    mockedAi.post.mockRejectedValue({ response: { status: 404 } });
    await runProjectMatching(1, { useHighestQualityModel: true, cvWeightPercent: 30 });
    expect(reAnalyzeRequest).toHaveBeenCalledWith(1, {
      useHighestQualityModel: true,
      cvWeightPercent: 30,
    });
  });

  it('runProjectMatching sends limit and cvWeightPercent to primary endpoint', async () => {
    mockedAi.post.mockResolvedValue({
      data: [{ userId: '1', name: 'A', cvId: 'c', score: 8.3 }],
      status: 200,
    });
    await runProjectMatching(11, { limit: 10, cvWeightPercent: 60 });
    expect(mockedAi.post).toHaveBeenCalledWith(
      'project-requests/11/matches/run',
      null,
      expect.objectContaining({
        params: { limit: '10', cvWeightPercent: '60' },
      }),
    );
    expect(reAnalyzeRequest).not.toHaveBeenCalled();
  });

  it('runProjectMatching omits useHighestQualityModel on primary endpoint by default', async () => {
    mockedAi.post.mockResolvedValue({
      data: [{ userId: '1', name: 'A', cvId: 'c', score: 7.5 }],
      status: 200,
    });
    await runProjectMatching(11, { limit: 10, cvWeightPercent: 60 });
    const config = mockedAi.post.mock.calls[0]?.[2] as { params?: Record<string, string> } | undefined;
    expect(config?.params?.useHighestQualityModel).toBeUndefined();
  });

  it('runProjectMatching sends useHighestQualityModel on primary endpoint when selected', async () => {
    mockedAi.post.mockResolvedValue({
      data: [{ userId: '1', name: 'A', cvId: 'c', score: 6.5 }],
      status: 200,
    });
    await runProjectMatching(11, { limit: 10, cvWeightPercent: 60, useHighestQualityModel: true });
    expect(mockedAi.post).toHaveBeenCalledWith(
      'project-requests/11/matches/run',
      null,
      expect.objectContaining({
        params: { limit: '10', cvWeightPercent: '60', useHighestQualityModel: 'true' },
      }),
    );
  });

  it('previewProjectMatches calls primary endpoint', async () => {
    mockedApi.get.mockResolvedValue({ data: { projectRequestId: 1, candidates: [] } });
    await previewProjectMatches(1, { limit: 5 });
    expect(mockedApi.get).toHaveBeenCalledWith(
      'project-requests/1/matches/preview',
      expect.objectContaining({ params: { limit: 5 } }),
    );
  });

  it('getProjectMatchResults returns null when empty', async () => {
    mockedApi.get.mockResolvedValue({ data: [] });
    const result = await getProjectMatchResults(99);
    expect(result).toBeNull();
  });
});
