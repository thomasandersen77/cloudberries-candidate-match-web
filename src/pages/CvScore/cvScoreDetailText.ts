import type { CvScoreDto } from '../../types/api';

/**
 * When and by what a score was written, for the line under it. Null when the score is from before
 * this was recorded, so the page can say so instead of guessing.
 */
export function formatScoredAt(dto: Pick<CvScoreDto, 'scoredAt' | 'model'>): string | null {
  if (!dto.scoredAt) return null;
  const d = new Date(dto.scoredAt);
  if (isNaN(d.getTime())) return null;
  const when = d.toLocaleString('nb-NO', { dateStyle: 'medium', timeStyle: 'short' });
  return dto.model ? `${when} · ${dto.model}` : when;
}

/** The server's own explanation when there is one, such as a CV with nothing in it to review. */
export function scoringErrorMessage(error: unknown): string {
  const message = (error as { response?: { data?: { message?: unknown } } })?.response?.data?.message;
  return typeof message === 'string' && message.trim() ? message : 'Scoring feilet';
}

/** The server decides rule compatibility; the browser does not infer it from version names. */
export function reviewRulesLabel(status: CvScoreDto['rulesStatus']): string | null {
  switch (status) {
    case 'OUTDATED': return 'Eldre vurderingsregler';
    case 'EQUIVALENT': return 'Eldre prompt, samme vurderingsregler';
    case 'UNKNOWN': return 'Ukjente vurderingsregler';
    default: return null;
  }
}
