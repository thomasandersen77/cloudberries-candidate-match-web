import apiClient, { aiScoringClient } from './apiClient';
import type { EmbeddingRunMissingResponse, EmbeddingUserCvRunResponse } from '../types/api';

export async function runForUserCv(userId: string, cvId: string): Promise<EmbeddingUserCvRunResponse> {
  const { data } = await apiClient.post<EmbeddingUserCvRunResponse>('embeddings/run', null, {
    params: { userId, cvId },
  });
  return data;
}

export async function runMissing(batchSize = 50): Promise<EmbeddingRunMissingResponse> {
  const { data } = await aiScoringClient.post<EmbeddingRunMissingResponse>(
    'embeddings/run/missing',
    null,
    { params: { batchSize } },
  );
  return data;
}
