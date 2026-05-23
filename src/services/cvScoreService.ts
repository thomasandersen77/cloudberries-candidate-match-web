import apiClient, { aiScoringClient } from './apiClient';
import type { CandidateDTO, CvScoreDto, CvScoringRunResponse, CvScoreAiProvider } from '../types/api';

export type { CvScoreAiProvider };

export type CvScoreRequestOptions = {
  aiProvider?: CvScoreAiProvider;
};

function scoringParams(opts?: CvScoreRequestOptions): Record<string, string> | undefined {
  return opts?.aiProvider ? { aiProvider: opts.aiProvider } : undefined;
}

export async function getAllCandidates(): Promise<CandidateDTO[]> {
  const { data } = await apiClient.get<CandidateDTO[]>('cv-score/all');
  return data;
}

export async function getCvScore(candidateId: string): Promise<CvScoreDto> {
  const { data } = await apiClient.get<CvScoreDto>(`cv-score/${encodeURIComponent(candidateId)}`);
  return data;
}

/** POST /cv-score/{candidateId} – score candidate (first run or alias for /run). */
export async function runScoreForCandidate(
  candidateId: string,
  opts?: CvScoreRequestOptions
): Promise<CvScoreDto> {
  const { data } = await aiScoringClient.post<CvScoreDto>(
    `cv-score/${encodeURIComponent(candidateId)}`,
    null,
    { params: scoringParams(opts) }
  );
  return data;
}

/** POST /cv-score/{candidateId}/recalculate – explicit recalculation. */
export async function recalculateScoreForCandidate(
  candidateId: string,
  opts?: CvScoreRequestOptions
): Promise<CvScoreDto> {
  const { data } = await aiScoringClient.post<CvScoreDto>(
    `cv-score/${encodeURIComponent(candidateId)}/recalculate`,
    null,
    { params: scoringParams(opts) }
  );
  return data;
}

export async function runScoreForAll(opts?: CvScoreRequestOptions): Promise<CvScoringRunResponse> {
  const { data } = await aiScoringClient.post<CvScoringRunResponse>(
    'cv-score/run/all',
    null,
    { params: scoringParams(opts) }
  );
  return data;
}
