import apiClient, { aiScoringClient } from './apiClient';
import type { CandidateDTO, CvScoreDto, CvScoringRunResponse, CvScoreAiProvider } from '../types/api';
import {
  normalizeScorePercent,
  sortCvScoreRows,
  type CvScoreListRow,
} from '../utils/cvScoreSort';

export type { CvScoreListRow };

/**
 * The list, from the one request that already has it.
 *
 * This used to call /cv-score/{id} once per candidate, ten at a time: 118 round trips on a corpus
 * of 118, after a first request that had returned every score already. The summary was the only
 * thing the extra calls added, and it lives in the same database row as the score, so the list
 * endpoint returns it now.
 *
 * The progress callback is kept because the signature is used by the page, and called once: there
 * are no partial results left to report.
 */
export async function loadCvScoreListRows(
  candidates: CandidateDTO[],
  onProgress?: (rows: CvScoreListRow[]) => void
): Promise<CvScoreListRow[]> {
  const rows = sortCvScoreRows(candidates.map((candidate) => ({
    id: candidate.id,
    name: candidate.name,
    scorePercent: normalizeScorePercent(candidate.score ?? 0),
    summary: candidate.summary ?? '',
  })));

  onProgress?.(rows);
  return rows;
}

export type { CvScoreAiProvider };

export type CvScoreRequestOptions = {
  aiProvider?: CvScoreAiProvider;
  /** When true, ask backend for the server-configured highest-quality AI model tier. */
  useHighestQualityModel?: boolean;
};

function scoringParams(opts?: CvScoreRequestOptions): Record<string, string> | undefined {
  const params: Record<string, string> = {};
  if (opts?.aiProvider) params.aiProvider = opts.aiProvider;
  // Only send the flag when explicitly enabled; omit otherwise (default = false on backend).
  if (opts?.useHighestQualityModel) params.useHighestQualityModel = 'true';
  return Object.keys(params).length > 0 ? params : undefined;
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

/** POST /cv-score/{candidateId}/run – trigger a scoring run for a single candidate. */
export async function runScoreRunForCandidate(
  candidateId: string,
  opts?: CvScoreRequestOptions
): Promise<CvScoreDto> {
  const { data } = await aiScoringClient.post<CvScoreDto>(
    `cv-score/${encodeURIComponent(candidateId)}/run`,
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
