import apiClient, { aiScoringClient } from './apiClient';
import type { CandidateDTO, CvScoreDto, CvScoringRunResponse, CvScoreAiProvider } from '../types/api';
import {
  normalizeScorePercent,
  sortCvScoreRows,
  type CvScoreListRow,
} from '../utils/cvScoreSort';

export type { CvScoreListRow };

const SCORE_FETCH_BATCH_SIZE = 10;

async function toCvScoreListRow(candidate: CandidateDTO): Promise<CvScoreListRow> {
  try {
    const dto = await getCvScore(candidate.id);
    return {
      id: candidate.id,
      name: candidate.name,
      scorePercent: normalizeScorePercent(dto.scorePercent),
      summary: dto.summary ?? '',
    };
  } catch {
    return {
      id: candidate.id,
      name: candidate.name,
      scorePercent: 0,
      summary: '',
    };
  }
}

/** Load CV scores in batches (avoids flooding the API) and return rows sorted by score desc. */
export async function loadCvScoreListRows(
  candidates: CandidateDTO[],
  onProgress?: (rows: CvScoreListRow[]) => void
): Promise<CvScoreListRow[]> {
  const accumulated: CvScoreListRow[] = [];

  for (let i = 0; i < candidates.length; i += SCORE_FETCH_BATCH_SIZE) {
    const batch = candidates.slice(i, i + SCORE_FETCH_BATCH_SIZE);
    const batchRows = await Promise.all(batch.map((c) => toCvScoreListRow(c)));
    accumulated.push(...batchRows);
    onProgress?.(sortCvScoreRows(accumulated));
  }

  return sortCvScoreRows(accumulated);
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
