export type CvScoreListRow = {
  id: string;
  name: string;
  scorePercent: number;
  summary: string;
  /** False for a CV with nothing in it to review. Missing means assessable. */
  assessable?: boolean;
  /** True when the score was not made from the CV as it is now. */
  stale?: boolean;
  scoredAt?: string | null;
};

export function normalizeScorePercent(value: unknown): number {
  const n = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(100, Math.round(n)));
}

/** Highest score first; ties broken by name (Norwegian locale). */
export function compareCvScoreRowsDesc(a: CvScoreListRow, b: CvScoreListRow): number {
  const byScore = normalizeScorePercent(b.scorePercent) - normalizeScorePercent(a.scorePercent);
  if (byScore !== 0) return byScore;
  return a.name.localeCompare(b.name, 'nb');
}

export function sortCvScoreRows(rows: readonly CvScoreListRow[]): CvScoreListRow[] {
  return [...rows].sort(compareCvScoreRowsDesc);
}
