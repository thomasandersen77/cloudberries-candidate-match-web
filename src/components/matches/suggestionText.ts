import type { RequirementScoreDto } from '../../types/api';

/**
 * The prompt's own three bands for a requirement score (MatchPromptTemplate, Steg 3.3), so the
 * colour on a chip means what the model was told the number means.
 */
export type ScoreBand = 'strong' | 'partial' | 'weak';

export function bandOf(score: number): ScoreBand {
  if (score >= 8) return 'strong';
  if (score >= 5) return 'partial';
  return 'weak';
}

export const BAND_TEXT: Record<ScoreBand, string> = {
  strong: '8–10: direkte, omfattende og nylig erfaring er tydelig beskrevet',
  partial: '5–7,9: relevant erfaring er nevnt, men mindre omfattende, eldre eller fra mindre relevante prosjekter',
  weak: 'Under 5: kompetansen er bare antydet, eller mangler'
};

/** "7,6 / 10". A screening score is out of ten, not a percentage, and says so. */
export function formatScore(score: number): string {
  return `${score.toFixed(1).replace('.', ',')} / 10`;
}

/** Musts first, each group in the request's order. */
export function groupRequirements(requirements: RequirementScoreDto[]): {
  must: RequirementScoreDto[];
  should: RequirementScoreDto[];
} {
  return {
    must: requirements.filter(r => r.isMustHave),
    should: requirements.filter(r => !r.isMustHave)
  };
}

/** How many to show before the reader asks for more. The run still scores the whole shortlist. */
export const DEFAULT_VISIBLE = 5;
