import apiClient from './apiClient';
import type { PagedMatchesListDto, MatchConsultantDto } from '../types/api';

/**
 * Lists project requests with pagination.
 * Aligns with OpenAPI DTOs for consistency.
 */
export async function listMatchRequests(params: { page?: number; size?: number; sort?: string } = {}): Promise<PagedMatchesListDto> {
  const { page = 0, size = 20, sort = 'uploadedAt,desc' } = params;
  const { data } = await apiClient.get<PagedMatchesListDto>('matches/requests-paged', {
    params: { page, size, sort },
  });
  return data;
}

/**
 * Gets top consultants for a project request using Gemini 3 Pro Preview AI batch ranking.
 * 
 * Backend process:
 * 1. Fetches ~50 candidates with required skills
 * 2. Scores by 50% skills + 50% CV quality → selects top 10
 * 3. Sends all CVs + requirements to Gemini in ONE API call
 * 4. Returns AI-ranked candidates with scores (0-100) and justifications
 * 
 * @param id - Project request ID
 * @param limit - Maximum number of consultants to return (default: 5)
 * @returns Array of ranked consultants with AI-generated scores and justifications
 */
export async function getTopConsultantsForRequest(id: number, limit = 5): Promise<MatchConsultantDto[]> {
  const { data } = await apiClient.get<MatchConsultantDto[]>(`matches/requests/${id}/top-consultants`, {
    params: { limit },
    timeout: 60_000, // Gemini 3 Pro Preview batch ranking can take up to 60 seconds
  });
  return data;
}
