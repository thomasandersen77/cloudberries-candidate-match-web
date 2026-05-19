import apiClient, { aiScoringClient } from './apiClient';
import type { MatchStatusDto, RecalculateMatchesResponse } from '../types/api';

export interface MatchItemDto {
  requestId: number;
  consultantId: number;
  name: string;
  score: number;
  reasons: string[];
  profileUrl?: string | null;
  cvQualityPercent?: number | null;
}

export async function getMatchStatus(requestId: number): Promise<MatchStatusDto> {
  const { data } = await apiClient.get<MatchStatusDto>(`matches/status/${requestId}`);
  return data;
}

/** Legacy: matches/{requestId} is not in OpenAPI spec */
export async function getTopMatchesFlat(requestId: number, limit = 10): Promise<MatchItemDto[]> {
  const { data } = await apiClient.get<MatchItemDto[]>(`matches/${requestId}`, { params: { limit } });
  return data;
}

export async function recalculateMatches(requestId: number): Promise<RecalculateMatchesResponse> {
  const { data } = await aiScoringClient.post<RecalculateMatchesResponse>(
    `matches/recalculate/${requestId}`
  );
  return data;
}

export async function triggerAllMatches(forceRecompute = false): Promise<void> {
  await aiScoringClient.post('matches/trigger-all', null, { params: { forceRecompute } });
}
