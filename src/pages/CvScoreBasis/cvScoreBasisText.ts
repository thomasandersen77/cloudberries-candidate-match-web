import type { CriterionDeduction, CvScoreBasisRow, ProjectMetrics, ProjectSummary } from '../../types/api';

/** The review's six criteria in Norwegian, as the prompt describes them. */
const CRITERION_LABELS: Record<string, string> = {
  projectDescriptions: 'Prosjektbeskrivelser',
  roleDescriptions: 'Rollebeskrivelser',
  technologyCoverage: 'Kompetanse per prosjekt',
  resultsAndValue: 'Resultater og verdi',
  profileAndStructure: 'Profil og struktur',
  seniorityAndContribution: 'Ansvar og faglig bidrag',
};

export function criterionLabel(key: string): string {
  return CRITERION_LABELS[key] ?? key;
}

/** Points lost over all criteria, which is 100 minus the total before it was rounded. */
export function totalPointsLost(criteria: CriterionDeduction[]): number {
  return Math.round(criteria.reduce((sum, c) => sum + c.pointsLost, 0) * 10) / 10;
}

/** «12/2025 – pågående», «04/2013 – 03/2014»; the API sends year-months as YYYY-MM. */
export function formatPeriod(project: Pick<ProjectMetrics, 'from' | 'to' | 'ongoing'>): string {
  const ym = (value?: string | null) => {
    if (!value) return '?';
    const [year, month] = value.split('-');
    return month ? `${month}/${year}` : year;
  };
  return `${ym(project.from)} – ${project.ongoing ? 'pågående' : ym(project.to)}`;
}

export interface SummaryLine {
  label: string;
  value: number;
  /** The count is a gap against the standard, so the page can mark it when it is above zero. */
  gap: boolean;
}

/** The recent-project counts, in the order the standard reads a project. */
export function summaryLines(summary: ProjectSummary): SummaryLine[] {
  return [
    { label: 'Prosjekter siste ti år eller pågående', value: summary.projects, gap: false },
    { label: 'Uten prosjektbeskrivelse', value: summary.emptyDescription, gap: true },
    { label: 'Beskrivelse under 60 ord', value: summary.shortDescription, gap: true },
    { label: 'Beskrivelse på 90–120 ord', value: summary.goldRangeDescription, gap: false },
    { label: 'Beskrivelse over 150 ord', value: summary.longDescription, gap: true },
    { label: 'Uten rolletekst', value: summary.withoutRoleText, gap: true },
    { label: 'Rolletekst i førsteperson', value: summary.firstPerson, gap: true },
    { label: 'Nevner metodikk', value: summary.withMethod, gap: false },
    { label: 'Nevner team', value: summary.withTeam, gap: false },
    { label: 'Tall med enhet (målbar verdi)', value: summary.withMeasurableValue, gap: false },
    { label: 'Uten ferdigheter', value: summary.withoutSkills, gap: true },
  ];
}

export type ScoreBasisSort = 'score' | 'date';
export type ScoreBasisSortOrder = 'asc' | 'desc';

/** Unknown dates stay last in either direction. A score tie is resolved by the newest review. */
export function sortScoreBases(rows: readonly CvScoreBasisRow[], column: ScoreBasisSort, order: ScoreBasisSortOrder): CvScoreBasisRow[] {
  const timestamp = (value: string | null | undefined): number | null => {
    const parsed = value ? Date.parse(value) : NaN;
    return Number.isFinite(parsed) ? parsed : null;
  };
  const compareDates = (a: CvScoreBasisRow, b: CvScoreBasisRow, direction: ScoreBasisSortOrder): number => {
    const x = timestamp(a.scoredAt), y = timestamp(b.scoredAt);
    if (x === null) return y === null ? 0 : 1;
    if (y === null) return -1;
    return direction === 'asc' ? x - y : y - x;
  };
  return [...rows].sort((a, b) => {
    const byScore = b.scorePercent - a.scorePercent;
    const primary = column === 'score'
      ? (order === 'desc' ? byScore : -byScore)
      : compareDates(a, b, order);
    const secondary = column === 'score' ? compareDates(a, b, 'desc') : byScore;
    return primary || secondary || a.name.localeCompare(b.name, 'nb');
  });
}
