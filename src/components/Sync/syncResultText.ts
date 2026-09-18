import type { ConsultantSyncResponse } from '../../types/api';

/**
 * The one sentence a person wants after "Hent alle CV-er": what the run did, in the order it matters.
 *
 * The response carries fourteen counters. Three of them (created, updated, departed) decide whether
 * anything needs looking at; the rest are detail. This puts the three first and only names the
 * others when they are non-zero, so a quiet nightly run reads as one line.
 */
export function describeSyncResult(result: ConsultantSyncResponse): string {
  const parts: string[] = [];
  parts.push(result.total === 1 ? '1 konsulent i Flowcase.' : `${result.total} konsulenter i Flowcase.`);

  const changes: string[] = [];
  if (result.created > 0) changes.push(count(result.created, 'ny konsulent', 'nye konsulenter'));
  if (result.updated > 0) changes.push(count(result.updated, 'oppdatert CV', 'oppdaterte CV-er'));
  parts.push(changes.length === 0 ? 'Ingen CV-er var endret.' : `${changes.join(' og ')}.`);

  if (result.departed > 0) parts.push(`${result.departed} har sluttet.`);
  if (result.returned > 0) parts.push(`${result.returned} er tilbake.`);
  if (result.skipped > 0) parts.push(count(result.skipped, 'hoppet over', 'hoppet over') + '.');
  if (result.failed > 0) parts.push(`${result.failed} feilet.`);
  return parts.join(' ');
}

/** "1 ny konsulent", "3 nye konsulenter". */
export function count(n: number, singular: string, plural: string): string {
  return `${n} ${n === 1 ? singular : plural}`;
}

/**
 * "16 nye, 88 uendret" from a list of counters, leaving out the zeros. When every counter is zero
 * the reader still needs a word, so "ingen" comes back rather than an empty string.
 */
export function joinCounts(entries: Array<[number | undefined, string]>): string {
  const named = entries
    .filter(([n]) => (n ?? 0) > 0)
    .map(([n, label]) => `${n} ${label}`);
  return named.length === 0 ? 'ingen' : named.join(', ');
}

/** The skip reasons the backend uses, in words. Unknown keys are shown as they are. */
export function skipReasonLabel(reason: string): string {
  switch (reason) {
    case 'missingFlowcaseUserIdOrCv':
      return 'mangler CV i Flowcase';
    default:
      return reason;
  }
}
