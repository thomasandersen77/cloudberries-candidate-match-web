import apiClient, { aiScoringClient } from './apiClient';
import type {
  PagedMatchesListDto,
  MatchConsultantDto,
  ProjectRequestSummaryDto,
} from '../types/api';
import type { MatchItemDto } from './newMatchesService';

export async function listMatchRequestSummaries(): Promise<ProjectRequestSummaryDto[]> {
  const { data } = await apiClient.get<ProjectRequestSummaryDto[]>('matches/requests');
  return data;
}

export async function listMatchRequests(params: { page?: number; size?: number; sort?: string } = {}): Promise<PagedMatchesListDto> {
  const { page = 0, size = 20, sort = 'uploadedAt,desc' } = params;
  const { data } = await apiClient.get<PagedMatchesListDto>('matches/requests-paged', {
    params: { page, size, sort },
  });
  return data;
}

export async function getTopConsultantsForRequest(id: number, limit = 5): Promise<MatchConsultantDto[]> {
  try {
    const { data } = await apiClient.get<MatchConsultantDto[]>(`matches/requests/${id}/top-consultants`, {
      params: { limit },
      timeout: 120_000,
    });
    return data;
  } catch {
    // Legacy fallback: some environments only expose matches/{requestId}
    const { data } = await apiClient.get<MatchItemDto[]>(`matches/${id}`, {
      params: { limit },
      timeout: 120_000,
    });
    return (data ?? []).map((item) => ({
      userId: item.consultantId ? String(item.consultantId) : undefined,
      name: item.name,
      relevanceScore: item.score,
      justification: item.reasons?.join(' • ') ?? '',
    })) as MatchConsultantDto[];
  }
}

export async function reAnalyzeRequest(id: number): Promise<MatchConsultantDto[]> {
  const { data } = await aiScoringClient.post<MatchConsultantDto[]>(
    `matches/requests/${id}/re-analyze`,
    null,
    { timeout: 60_000 }
  );
  return data;
}
