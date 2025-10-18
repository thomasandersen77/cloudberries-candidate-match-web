import apiClient from './apiClient';

export interface MatchStatusDto {
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  lastUpdated?: string | null;
  error?: string | null;
}

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

export async function getTopMatchesFlat(requestId: number, limit = 10): Promise<MatchItemDto[]> {
  const { data } = await apiClient.get<MatchItemDto[]>(`matches/${requestId}`, { params: { limit } });
  return data;
}

export async function recalculateMatches(requestId: number) {
  await apiClient.post(`matches/recalculate/${requestId}`);
}
