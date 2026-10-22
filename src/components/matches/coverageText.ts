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

/** How many names the line shows before it says how many more there are. */
const FULL_MATCH_NAMES_SHOWN = 4;

/**
 * Who covers every must, by name: "Dekker alle må-krav: Ayhan Ileri". The card said only how many,
 * so finding the one person meant opening it and reading down a list ordered by something else.
 * Null when nobody does, or when the request named no technology.
 */
export function describeFullMatch(coverage: RequirementCoverage): string | null {
  const names = coverage.fullMatchNames ?? [];
  if (names.length === 0 || !coverage.fullMatchBasis) return null;
  const kind = coverage.fullMatchBasis === 'MUST' ? 'må-krav' : 'bør-krav';
  const shown = names.slice(0, FULL_MATCH_NAMES_SHOWN).join(', ');
  const rest = names.length - FULL_MATCH_NAMES_SHOWN;
  return `Dekker alle ${kind}: ${shown}${rest > 0 ? ` og ${rest} til` : ''}`;
}

/**
 * The tooltip behind one requirement chip.
 *
 * "Må-krav: Kotlin. 39 aktive konsulenter har kotlin på CV-en, 15 av dem bare fra prosjekterfaring."
 * The second half is said whenever it is non-zero: a skill on a project carries no years, and the
 * card used to count none of those people at all, so the reader should see both that they are
 * counted now and that the record behind them is thinner.
 */
export function describeRequirement(item: RequirementCoverageItem): string {
  const kind = item.priority === 'MUST' ? 'Må-krav' : 'Bør-krav';
  const skills = item.skills.join(' eller ').toLowerCase();
  const projectPart = item.projectOnly > 0 ? `, ${item.projectOnly} av dem bare fra prosjekterfaring` : '';
  return `${kind}: ${item.name}. ${item.consultants} aktive konsulenter har ${skills} på CV-en${projectPart}.`;
}

/** "3 AI-vurdert – 10.9.2026", or that nobody has been. */
export function describeAiStatus(count: number | null | undefined, at: string | null | undefined): string {
  if (!count) return 'Ikke AI-vurdert';
  const when = at ? ` – ${new Date(at).toLocaleDateString('nb-NO')}` : '';
  return `${count} AI-vurdert${when}`;
}

