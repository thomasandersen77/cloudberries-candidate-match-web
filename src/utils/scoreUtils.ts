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

export function getActiveQualityScore(c: { cvs?: Array<{ active?: boolean; qualityScore?: number | null }> }): number | null {
  const activeCv = c?.cvs?.find(cv => cv.active);
  const q = activeCv?.qualityScore;
  if (typeof q === 'number' && !Number.isNaN(q)) return clamp(q, 0, 100);
  return null;
}

export function compareByQualityThenName<T extends { name: string; cvs?: Array<{ active?: boolean; qualityScore?: number | null }> }>(a: T, b: T): number {
  const qa = getActiveQualityScore(a);
  const qb = getActiveQualityScore(b);
  if (qa !== null && qb !== null && qa !== qb) return qb - qa; // desc
  if (qa === null && qb !== null) return 1;   // nulls last
  if (qa !== null && qb === null) return -1;  // non-nulls first
  // tie-break by name asc
  return a.name.localeCompare(b.name, 'no-NO');
}