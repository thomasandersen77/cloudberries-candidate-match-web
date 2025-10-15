import apiClient from './apiClient';
import type { CandidateMatchResponse, MatchApiRequest, SkillsRequest } from '../types/api';

export async function findMatches(payload: MatchApiRequest): Promise<CandidateMatchResponse[]> {
  const { data } = await apiClient.post<CandidateMatchResponse[]>(
    'matches',
    payload,
    { timeout: 600_000 }
  );
  return data;
}

export async function findMatchesBySkills(skills: string[]): Promise<CandidateMatchResponse[]> {
  const body: SkillsRequest = { skills };
  const { data } = await apiClient.post<CandidateMatchResponse[]>(
    'matches/by-skills',
    body,
    { timeout: 600_000 }
  );
  return data;
}

export async function uploadCvAndMatch(file: File, projectRequestText: string): Promise<CandidateMatchResponse[]> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('projectRequestText', projectRequestText);
  const { data } = await apiClient.post<CandidateMatchResponse[]>('matches/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    timeout: 600_000,
  });
  return data;
}
