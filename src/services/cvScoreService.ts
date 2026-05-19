import apiClient, { aiScoringClient } from './apiClient';
import type { CandidateDTO, CvScoreDto, CvScoringRunResponse } from '../types/api';

export async function getAllCandidates(): Promise<CandidateDTO[]> {
  const { data } = await apiClient.get<CandidateDTO[]>('cv-score/all');
  return data;
}

export async function getCvScore(candidateId: string): Promise<CvScoreDto> {
  const { data } = await apiClient.get<CvScoreDto>(`cv-score/${encodeURIComponent(candidateId)}`);
  return data;
}

export async function runScoreForCandidate(candidateId: string): Promise<CvScoreDto> {
  const { data } = await aiScoringClient.post<CvScoreDto>(
    `cv-score/${encodeURIComponent(candidateId)}`
  );
  return data;
}

export async function runScoreForAll(): Promise<CvScoringRunResponse> {
  const { data } = await aiScoringClient.post<CvScoringRunResponse>('cv-score/run/all');
  return data;
}
