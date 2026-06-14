import apiClient, { aiScoringClient } from './apiClient';
import type {
  PagedMatchesListDto,
  MatchCandidateDto,
  ProjectRequestSummaryDto,
  ModelTier,
} from '../types/api';
import type { MatchItemDto } from './newMatchesService';

export async function listMatchRequestSummaries(): Promise<ProjectRequestSummaryDto[]> {
  const { data } = await apiClient.get<ProjectRequestSummaryDto[]>('matches/requests');
  return data;
}

export async function listMatchRequests(params: { page?: number; size?: number; sort?: string } = {}): Promise<PagedMatchesListDto> {
  const { page = 0, size = 20, sort = 'uploadedAt,desc' } = params;
  const { data } = await apiClient.get<PagedMatchesListDto>('matches/requests-paged', {
    params: { page, size, sort },
  });
  return data;
}

// AI-tunge, synkrone kall mot Anthropic kan ta vesentlig lengre tid enn standard
// apiClient-timeout. Vi bruker aiScoringClient (lang timeout) for disse.
const AI_MATCH_TIMEOUT_MS = 240_000;

export async function getTopConsultantsForRequest(id: number, limit = 5): Promise<MatchCandidateDto[]> {
  try {
    const { data } = await aiScoringClient.get<MatchCandidateDto[]>(`matches/requests/${id}/top-consultants`, {
      params: { limit },
      timeout: AI_MATCH_TIMEOUT_MS,
    });
    return data;
  } catch {
    const { data } = await aiScoringClient.get<MatchItemDto[]>(`matches/${id}`, {
      params: { limit },
      timeout: AI_MATCH_TIMEOUT_MS,
    });
    return (data ?? []).map((item) => ({
      userId: item.consultantId ? String(item.consultantId) : '',
      name: item.name,
      cvId: '',
      score: item.score,
      justification: item.reasons?.join(' • ') ?? null,
    })) as MatchCandidateDto[];
  }
}

export type AiMatchOptions = {
  /** Explicit model tier (FAST/DEFAULT/QUALITY). Wins over useHighestQualityModel. */
  modelTier?: ModelTier;
  /** Legacy boolean flag; only sent when modelTier is not set. */
  useHighestQualityModel?: boolean;
  /** Weight (0–100) given to CV quality vs skill match. Server default is 50. */
  cvWeightPercent?: number;
};

/** Backwards-compatible alias. */
export type AiQualityOptions = AiMatchOptions;
export type AiRunMatchOptions = AiMatchOptions & { limit?: number };

function aiMatchParams(opts?: AiRunMatchOptions): Record<string, string> | undefined {
  if (!opts) return undefined;
  const params: Record<string, string> = {};
  if (typeof opts.limit === 'number' && Number.isFinite(opts.limit)) {
    params.limit = String(opts.limit);
  }
  if (opts.modelTier) {
    params.modelTier = opts.modelTier;
  } else if (opts.useHighestQualityModel) {
    params.useHighestQualityModel = 'true';
  }
  if (typeof opts.cvWeightPercent === 'number' && Number.isFinite(opts.cvWeightPercent)) {
    params.cvWeightPercent = String(opts.cvWeightPercent);
  }
  return Object.keys(params).length > 0 ? params : undefined;
}
export async function previewRequestMatches(id: number, limit = 10): Promise<MatchCandidateDto[]> {
  const { data } = await apiClient.get<MatchCandidateDto[]>(`matches/requests/${id}/matches/preview`, {
    params: { limit },
  });
  return data;
}

/**
 * Deprecated endpoint client kept for backend compatibility.
 * Preferred flow is /project-requests/{id}/matches/run.
 */
export async function runRequestMatches(id: number, opts?: AiRunMatchOptions): Promise<MatchCandidateDto[]> {
  const { data } = await aiScoringClient.post<MatchCandidateDto[]>(
    `matches/requests/${id}/matches/run`,
    null,
    { timeout: AI_MATCH_TIMEOUT_MS, params: aiMatchParams(opts) }
  );
  return data;
}

/**
 * Force a fresh AI re-analysis (POST re-analyze). Returns ranked consultants directly.
 * GET top-consultants stays cache-aware; model/weight params are only sent here.
 */
export async function reAnalyzeRequest(id: number, opts?: AiMatchOptions): Promise<MatchCandidateDto[]> {
  const { data } = await aiScoringClient.post<MatchCandidateDto[]>(
    `matches/requests/${id}/re-analyze`,
    null,
    { timeout: AI_MATCH_TIMEOUT_MS, params: aiMatchParams(opts) }
  );
  return data;
}
