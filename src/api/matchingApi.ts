/**
 * Compatibility layer for project-request matching.
 * UI should call these functions — not raw endpoints.
 */
import { isAxiosError } from 'axios';
import apiClient, { aiScoringClient } from '../services/apiClient';
import type {
  MatchCandidateDto,
  MatchStatusDto,
  MatchPreviewCandidateDto,
  ProjectMatchPreviewResponse,
  ProjectMatchResults,
  ProjectMatchStatusResponse,
  ProjectRequestResponseDto,
} from '../types/api';
import { previewRequestMatches, reAnalyzeRequest, runRequestMatches } from '../services/matchesRequestsService';
import { getMatchStatus } from '../services/newMatchesService';
import { projectMatchesService } from '../services/projectMatchesService';
import { uploadProjectRequest as uploadProjectRequestRaw, getProjectRequestById } from '../services/projectRequestsService';

const AI_MATCH_TIMEOUT_MS = 240_000;

export type MatchingQualityOptions = {
  limit?: number;
  /** Default false — only send when user opts in. */
  useHighestQualityModel?: boolean;
  cvWeightPercent?: number;
};

function runParams(opts?: MatchingQualityOptions): Record<string, string> | undefined {
  if (!opts) return undefined;
  const params: Record<string, string> = {};
  if (opts.useHighestQualityModel) params.useHighestQualityModel = 'true';
  if (typeof opts.limit === 'number' && Number.isFinite(opts.limit)) {
    params.limit = String(opts.limit);
  }
  if (typeof opts.cvWeightPercent === 'number' && Number.isFinite(opts.cvWeightPercent)) {
    params.cvWeightPercent = String(opts.cvWeightPercent);
  }
  return Object.keys(params).length > 0 ? params : undefined;
}

function isNotFound(error: unknown): boolean {
  return isAxiosError(error) && error.response?.status === 404;
}

function isMissingEndpoint(error: unknown): boolean {
  return isAxiosError(error) && (error.response?.status === 404 || error.response?.status === 405);
}

function toResults(id: number, matches: MatchCandidateDto[], lastUpdated?: string | null): ProjectMatchResults {
  return {
    projectRequestId: id,
    matches,
    totalMatches: matches.length,
    lastUpdated: lastUpdated ?? undefined,
  };
}

function toPreviewResponseFromLegacy(
  id: number,
  limit: number,
  matches: MatchCandidateDto[]
): ProjectMatchPreviewResponse {
  const candidates: MatchPreviewCandidateDto[] = (matches ?? []).map((candidate) => ({
    userId: candidate.userId,
    cvId: candidate.cvId,
    name: candidate.name,
    combinedScore: candidate.score,
    reason: candidate.justification ?? undefined,
    email: candidate.email ?? undefined,
  }));
  return {
    projectRequestId: id,
    limit,
    semanticSearchReady: false,
    semanticSearchUsed: false,
    candidates,
  };
}

function top10ToResults(id: number, top: NonNullable<Awaited<ReturnType<typeof projectMatchesService.getTopMatches>>>): ProjectMatchResults {
  const matches: MatchCandidateDto[] = (top.matches ?? []).map((m) => ({
    userId: m.userId ?? String(m.consultantId ?? ''),
    name: m.consultantName ?? '',
    cvId: m.cvId ?? '',
    score: m.matchScore ?? 0,
    justification: m.matchExplanation ?? null,
    skills: undefined,
    email: null,
  }));
  return {
    projectRequestId: top.projectRequestId ?? id,
    matches,
    totalMatches: top.totalMatches ?? matches.length,
    lastUpdated: top.lastUpdated ?? undefined,
  };
}

// --- Project requests ---

export async function uploadProjectRequest(
  file: File,
  opts?: { useHighestQualityModel?: boolean },
): Promise<ProjectRequestResponseDto> {
  return uploadProjectRequestRaw(file, opts);
}

export { getProjectRequestById };

// --- Preview (cheap, no LLM) ---

export async function previewProjectMatches(
  id: number,
  opts?: { limit?: number },
): Promise<ProjectMatchPreviewResponse | null> {
  const limit = opts?.limit ?? 10;
  try {
    const { data } = await apiClient.get<ProjectMatchPreviewResponse>(
      `project-requests/${id}/matches/preview`,
      { params: { limit } },
    );
    return data;
  } catch (error) {
    if (!isMissingEndpoint(error)) throw error;
  }

  try {
    const legacyMatches = await previewRequestMatches(id, limit);
    return toPreviewResponseFromLegacy(id, limit, legacyMatches ?? []);
  } catch (error) {
    if (isMissingEndpoint(error) || isNotFound(error)) return null;
    throw error;
  }
}

// --- Persisted results (no LLM on GET) ---

export async function getProjectMatchResults(id: number, opts?: { limit?: number }): Promise<ProjectMatchResults | null> {
  try {
    const { data } = await apiClient.get<MatchCandidateDto[]>(`project-requests/${id}/matches`, {
      params: opts?.limit != null ? { limit: opts.limit } : undefined,
    });
    if (!data || data.length === 0) return null;
    return toResults(id, data);
  } catch (error) {
    if (!isNotFound(error) && !isMissingEndpoint(error)) throw error;
  }

  // Legacy: GET /matches/requests/{id}/top — cached results only
  try {
    const top = await projectMatchesService.getTopMatches(id);
    if (top && (top.matches?.length ?? 0) > 0) return top10ToResults(id, top);
  } catch {
    /* ignore */
  }
  return null;
}

// --- Status ---

export async function getProjectMatchStatus(id: number): Promise<ProjectMatchStatusResponse | MatchStatusDto> {
  try {
    const { data } = await apiClient.get<ProjectMatchStatusResponse>(`project-requests/${id}/matches/status`);
    return data;
  } catch (error) {
    if (!isMissingEndpoint(error)) throw error;
  }
  return getMatchStatus(id);
}

// --- Explicit AI run ---

export async function runProjectMatching(
  id: number,
  opts?: MatchingQualityOptions,
): Promise<ProjectMatchResults | { async: true; requestId: number }> {
  const limit = opts?.limit ?? 10;
  try {
    const { data, status } = await aiScoringClient.post<MatchCandidateDto[]>(
      `project-requests/${id}/matches/run`,
      null,
      { params: runParams({ ...opts, limit }), timeout: AI_MATCH_TIMEOUT_MS },
    );
    if (status === 202) {
      return { async: true, requestId: id };
    }
    return toResults(id, data ?? [], new Date().toISOString());
  } catch (error) {
    if (!isMissingEndpoint(error)) throw error;
  }
  // Legacy sync: POST /matches/requests/{id}/matches/run (deprecated)
  try {
    const legacyMatches = await runRequestMatches(id, {
      limit,
      useHighestQualityModel: opts?.useHighestQualityModel,
      cvWeightPercent: opts?.cvWeightPercent,
    });
    return toResults(id, legacyMatches, new Date().toISOString());
  } catch (error) {
    if (!isMissingEndpoint(error)) throw error;
  }

  // Legacy sync: POST re-analyze (deprecated)
  const consultants = await reAnalyzeRequest(id, {
    useHighestQualityModel: opts?.useHighestQualityModel,
    cvWeightPercent: opts?.cvWeightPercent,
  });
  return toResults(id, consultants, new Date().toISOString());
}

/** Force re-run (same as run with explicit user intent). */
export async function recalculateProjectMatches(
  id: number,
  opts?: MatchingQualityOptions,
): Promise<ProjectMatchResults | { async: true; requestId: number }> {
  return runProjectMatching(id, opts);
}
