export function clamp(value: number, min: number, max: number): number {
  if (Number.isNaN(value)) return min;
  return Math.min(max, Math.max(min, value));
}

/**
 * Map a 0–100 score to a hue from red (0deg) → orange/yellow (~60deg) → green (120deg)
 */
export function scoreToHue(score: number): number {
  const s = clamp(score ?? 0, 0, 100);
  return (s / 100) * 120; // 0 = red, 120 = green
}

/**
 * Returns an HSL color string for the given score.
 * Slightly saturated and mid lightness for ring visibility.
 */
export function getScoreColor(score: number): string {
  const hue = scoreToHue(score);
  return `hsl(${hue}deg 70% 45%)`;
}

type CvLike = { active?: boolean; qualityScore?: number | null };

/** Anything that may carry a CV quality score, in any of the shapes the API returns. */
export type QualityScoreSource = {
  qualityScore?: number | null;
  cvData?: CvLike | null;
  cvs?: Array<CvLike>;
};

/**
 * CV quality on a 0–100 scale, or null when the consultant has no scored CV.
 *
 * Consultant endpoints return the score at the top level as `qualityScore`, and the CV payload as
 * a single `cvData` object. The `cvs` array is only produced by a few legacy shapes, so it is
 * checked last rather than first.
 */
export function getActiveQualityScore(c: QualityScoreSource): number | null {
  const candidates: Array<number | null | undefined> = [
    c?.qualityScore,
    c?.cvData?.qualityScore,
    c?.cvs?.find(cv => cv.active)?.qualityScore,
    c?.cvs?.find(cv => typeof cv.qualityScore === 'number')?.qualityScore,
  ];
  for (const q of candidates) {
    if (typeof q === 'number' && !Number.isNaN(q)) return clamp(q, 0, 100);
  }
  return null;
}

export function compareByQualityThenName<T extends { name: string } & QualityScoreSource>(a: T, b: T): number {
  const qa = getActiveQualityScore(a);
  const qb = getActiveQualityScore(b);
  if (qa !== null && qb !== null && qa !== qb) return qb - qa; // desc
  if (qa === null && qb !== null) return 1;   // nulls last
  if (qa !== null && qb === null) return -1;  // non-nulls first
  // tie-break by name asc
  return a.name.localeCompare(b.name, 'no-NO');
}