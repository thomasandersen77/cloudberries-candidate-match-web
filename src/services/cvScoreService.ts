import apiClient from './apiClient';
import type { CandidateDTO, CvScoreDto } from '../types/api';

// NOTE: This service is used for CV scoring management pages only.
// Search components should NOT use this service for enrichment;
// they should rely on server-provided qualityScore in search results.

export async function getAllCandidates(): Promise<CandidateDTO[]> {
  const { data } = await apiClient.get<CandidateDTO[]>('cv-score/all');
  return data;
}

export async function getCvScore(candidateId: string): Promise<CvScoreDto> {
  const { data } = await apiClient.get<CvScoreDto>(`cv-score/${encodeURIComponent(candidateId)}`);
  return data;
}

export async function runScoreForCandidate(candidateId: string): Promise<CvScoreDto> {
  // AI-scoring kan ta lang tid – sett 10 minutters timeout
  const { data } = await apiClient.post<CvScoreDto>(
    `cv-score/${encodeURIComponent(candidateId)}/run`,
    undefined,
    { timeout: 600_000 }
  );
  return data;
}

export interface CvScoringRunResponse { processedCount: number }

export async function runScoreForAll(): Promise<CvScoringRunResponse> {
  // Batch-scoring for alle – sett 10 minutters timeout
  const { data } = await apiClient.post<CvScoringRunResponse>(
    `cv-score/run/all`,
    undefined,
    { timeout: 600_000 }
  );
  return data;
}
