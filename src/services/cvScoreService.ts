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