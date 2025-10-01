import apiClient from './apiClient';
import type { PagedMatchesListDto, MatchConsultantDto } from '../types/api';

// Align with OpenAPI DTOs (paths may be added in backend; using same types for consistency)
export async function listMatchRequests(params: { page?: number; size?: number; sort?: string } = {}): Promise<PagedMatchesListDto> {
  const { page = 0, size = 20, sort = 'date,desc' } = params;
  const { data } = await apiClient.get<PagedMatchesListDto>('/api/matches/requests', {
    params: { page, size, sort },
  });
  return data;
}

export async function getTopConsultantsForRequest(id: number, limit = 5): Promise<MatchConsultantDto[]> {
  const { data } = await apiClient.get<MatchConsultantDto[]>(`/api/matches/requests/${id}/top-consultants`, {
    params: { limit },
  });
  return data;
}
