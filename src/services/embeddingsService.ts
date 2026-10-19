import apiClient, { aiScoringClient } from './apiClient';
import type {
  ChunkRebuildResult,
  EmbeddingFreshness,
  EmbeddingRebuildResult,
  EmbeddingUserCvRunResponse,
  RebuildOrder,
} from '../types/api';

export async function runForUserCv(userId: string, cvId: string): Promise<EmbeddingUserCvRunResponse> {
  const { data } = await apiClient.post<EmbeddingUserCvRunResponse>('embeddings/run', null, {
    params: { userId, cvId },
  });
  return data;
}

/** Per consultant: missing, stale or current, for the whole-CV vector and the chunks. No provider call. */
export async function getEmbeddingFreshness(): Promise<EmbeddingFreshness> {
  const { data } = await apiClient.get<EmbeddingFreshness>('consultants/embeddings/freshness');
  return data;
}

export type RebuildOptions = {
  /** Rebuild every vector, also those made from the CV as it is now. */
  force: boolean;
  /** Stop after this many consultants. Omitted means all. */
  limit?: number;
  order: RebuildOrder;
};

function rebuildParams({ force, limit, order }: RebuildOptions) {
  return { force, order, ...(limit ? { limit } : {}) };
}

export async function rebuildWholeCvEmbeddings(opts: RebuildOptions): Promise<EmbeddingRebuildResult> {
  const { data } = await aiScoringClient.post<EmbeddingRebuildResult>('consultants/embeddings/rebuild', null, {
    params: rebuildParams(opts),
  });
  return data;
}

export async function rebuildChunkEmbeddings(opts: RebuildOptions): Promise<ChunkRebuildResult> {
  const { data } = await aiScoringClient.post<ChunkRebuildResult>('consultants/embeddings/chunks/rebuild', null, {
    params: rebuildParams(opts),
  });
  return data;
}
