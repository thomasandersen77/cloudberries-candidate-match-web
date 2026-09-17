/**
 * Formatting for the two score scales the matching pages show.
 *
 * Fourteen more helpers used to live here, with score levels, colours, sorting, statistics and
 * English relative times. Their only callers were `MatchResultsTable` and `ProjectMatchCard`,
 * which only `ProjectMatchingPage` rendered, and no route pointed at that page. They went with it.
 */

/** OpenAPI MatchCandidateDto.score is 0.0–10.0 (double). */
export function formatMatchScore(score: number | null | undefined): string {
  if (typeof score !== 'number' || Number.isNaN(score)) return '–';
  return score.toFixed(1);
}

/**
 * e.g. " • score 8.3 / 10" for AI match rows; empty string when score is missing.
 *
 * The scale is spelled out because two different numbers appear on the same page: the preview's
 * ranking is a percentage of a weighted 0..1 signal, and this is the model's evaluation on the
 * 0-10 scale its schema declares. A bare "score 5.8" next to "rang 61 %" reads as the worse of the
 * two when it is in fact the more favourable.
 */
export function formatMatchScoreSuffix(score: number | null | undefined): string {
  const label = formatMatchScore(score);
  return label === '–' ? '' : ` • score ${label} / 10`;
}

/**
 * Formats a 0..1 score as a whole percentage, e.g. 0.904 -> "90 %".
 *
 * Preselection reports skill, semantic, quality and combined scores on a 0..1 scale;
 * `formatMatchScore` is for the 0-10 scale the AI match results use.
 */
export function formatPercentScore(score: number | null | undefined): string {
  if (typeof score !== 'number' || Number.isNaN(score)) return '–';
  return `${Math.round(score * 100)} %`;
}
