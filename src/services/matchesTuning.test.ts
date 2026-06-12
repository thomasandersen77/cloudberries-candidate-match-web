import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('./apiClient', () => {
  return {
    default: { get: vi.fn(), post: vi.fn() },
    aiScoringClient: { get: vi.fn(), post: vi.fn() },
  };
});

import { aiScoringClient } from './apiClient';
import { reAnalyzeRequest, getTopConsultantsForRequest } from './matchesRequestsService';

const mockedAi = aiScoringClient as unknown as {
  get: ReturnType<typeof vi.fn>;
  post: ReturnType<typeof vi.fn>;
};

function postParams(): Record<string, unknown> | undefined {
  const call = mockedAi.post.mock.calls.at(-1);
  return (call?.[2] as { params?: Record<string, unknown> } | undefined)?.params;
}

function getParams(): Record<string, unknown> | undefined {
  const call = mockedAi.get.mock.calls.at(-1);
  return (call?.[1] as { params?: Record<string, unknown> } | undefined)?.params;
}

describe('matches re-analyze tuning (modelTier + cvWeightPercent)', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    mockedAi.post.mockResolvedValue({ data: [] });
    mockedAi.get.mockResolvedValue({ data: [] });
  });

  it('sends modelTier and cvWeightPercent when provided', async () => {
    await reAnalyzeRequest(1, { modelTier: 'QUALITY', cvWeightPercent: 60 });
    expect(postParams()).toMatchObject({ modelTier: 'QUALITY', cvWeightPercent: '60' });
  });

  it('lets explicit modelTier win over useHighestQualityModel', async () => {
    await reAnalyzeRequest(1, { modelTier: 'FAST', useHighestQualityModel: true });
    const params = postParams();
    expect(params).toMatchObject({ modelTier: 'FAST' });
    expect(params?.useHighestQualityModel).toBeUndefined();
  });

  it('falls back to useHighestQualityModel when no modelTier', async () => {
    await reAnalyzeRequest(1, { useHighestQualityModel: true });
    expect(postParams()).toMatchObject({ useHighestQualityModel: 'true' });
  });

  it('sends no tuning params when options are empty', async () => {
    await reAnalyzeRequest(1);
    expect(postParams()).toBeUndefined();
  });

  it('GET top-consultants stays cache-aware: only limit, never modelTier/cvWeightPercent', async () => {
    await getTopConsultantsForRequest(1, 5);
    const params = getParams();
    expect(params).toMatchObject({ limit: 5 });
    expect(params?.modelTier).toBeUndefined();
    expect(params?.cvWeightPercent).toBeUndefined();
    expect(params?.useHighestQualityModel).toBeUndefined();
  });
});
