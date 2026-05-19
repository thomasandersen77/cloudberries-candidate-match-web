import apiClient, { aiScoringClient } from './apiClient';
import type {
  PagedMatchesListDto,
  MatchConsultantDto,
  ProjectRequestSummaryDto,
} from '../types/api';

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
  const { data } = await apiClient.get<MatchConsultantDto[]>(`matches/requests/${id}/top-consultants`, {
    params: { limit },
    timeout: 60_000,
  });
  return data;
}

export async function reAnalyzeRequest(id: number): Promise<MatchConsultantDto[]> {
  const { data } = await aiScoringClient.post<MatchConsultantDto[]>(
    `matches/requests/${id}/re-analyze`,
    null,
    { timeout: 60_000 }
  );
  return data;
}
