import type { components } from '../../api/generated';

export type RequirementCoverage = components['schemas']['RequirementCoverageDto'];
export type RequirementCoverageItem = components['schemas']['RequirementCoverageItemDto'];

/**
 * One line on what the numbers below mean, for the card and the panel alike.
 *
 * "Dekker 11 av 11 teknologikrav · 2 krav sjekkes ikke mot ferdigheter". The second half is the
 * honest part: years, language, sector and a technology the corpus has never seen all end up
 * there, and the reader must know they were not counted rather than counted as covered.
 */
export function describeCoverage(coverage: RequirementCoverage): string {
  const other = coverage.otherRequirements.length;
  const otherPart = other === 0 ? '' : ` · ${other} ${other === 1 ? 'krav sjekkes' : 'krav sjekkes'} ikke mot ferdigheter`;
  if (coverage.technologyRequirements === 0) {
    return `Ingen krav som kan sjekkes mot ferdighetene i CV-ene${otherPart}`;
  }
  return `Dekker ${coverage.covered} av ${coverage.technologyRequirements} teknologikrav${otherPart}`;
}

/** "3 AI-vurdert 10.9.2026", or that nobody has been. */
export function describeAiStatus(count: number | null | undefined, at: string | null | undefined): string {
  if (!count) return 'Ikke AI-vurdert';
  const when = at ? ` ${new Date(at).toLocaleDateString('no-NO')}` : '';
  return `${count} AI-vurdert${when}`;
}

