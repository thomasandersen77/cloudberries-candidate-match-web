import apiClient from './apiClient';
import type { CandidateDTO, CvScoreDto } from '../types/api';

export async function getAllCandidates(): Promise<CandidateDTO[]> {
  const { data } = await apiClient.get<CandidateDTO[]>('/api/cv-score/all');
  return data;
}

export async function getCvScore(candidateId: string): Promise<CvScoreDto> {
  const { data } = await apiClient.get<CvScoreDto>(`/api/cv-score/${encodeURIComponent(candidateId)}`);
  return data;
}

export async function runScoreForCandidate(candidateId: string): Promise<CvScoreDto> {
  const { data } = await apiClient.post<CvScoreDto>(`/api/cv-score/${encodeURIComponent(candidateId)}/run`);
  return data;
}

export interface CvScoringRunResponse { processedCount: number }

export async function runScoreForAll(): Promise<CvScoringRunResponse> {
  const { data } = await apiClient.post<CvScoringRunResponse>(`/api/cv-score/run/all`);
  return data;
}
