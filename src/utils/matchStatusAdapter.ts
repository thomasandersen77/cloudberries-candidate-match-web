import type { MatchStatusDto, ProjectMatchStatusResponse } from '../types/api';

/** Frontend-normalized matching lifecycle (Task 10). */
export type FrontendMatchPhase =
  | 'NOT_STARTED'
  | 'READY_FOR_PREVIEW'
  | 'PREVIEW_READY'
  | 'RUNNING'
  | 'COMPLETED'
  /** Some candidates have a score, some do not; the list shows the ones that do. */
  | 'PARTIAL'
  | 'FAILED'
  | 'CANCELLED';

export function mapBackendPhase(raw?: string | null): FrontendMatchPhase {
  const v = (raw ?? '').toUpperCase();
  switch (v) {
    case 'NOT_STARTED':
      return 'NOT_STARTED';
    case 'READY_FOR_PREVIEW':
      return 'READY_FOR_PREVIEW';
    case 'PREVIEW_READY':
      return 'PREVIEW_READY';
    case 'RUNNING':
    case 'PENDING':
      return 'RUNNING';
    case 'COMPLETED':
      return 'COMPLETED';
    case 'PARTIAL':
      return 'PARTIAL';
    case 'FAILED':
      return 'FAILED';
    case 'CANCELLED':
      return 'CANCELLED';
    default:
      return 'NOT_STARTED';
  }
}

export function fromProjectMatchStatus(dto: ProjectMatchStatusResponse): FrontendMatchPhase {
  return mapBackendPhase(dto.status);
}

export function fromLegacyMatchStatus(dto: MatchStatusDto): FrontendMatchPhase {
  return mapBackendPhase(dto.status);
}

export function phaseLabel(phase: FrontendMatchPhase): string {
  switch (phase) {
    case 'NOT_STARTED':
      return 'Ikke startet';
    case 'READY_FOR_PREVIEW':
      return 'Klar for forhåndsvisning';
    case 'PREVIEW_READY':
      return 'Forhåndsvisning klar';
    case 'RUNNING':
      return 'Kjører AI-matching…';
    case 'COMPLETED':
      return 'Fullført';
    case 'PARTIAL':
      return 'Delvis fullført';
    case 'FAILED':
      return 'Feilet';
    case 'CANCELLED':
      return 'Avbrutt';
    default:
      return 'Ukjent';
  }
}

/**
 * How far a run has come, or how it went, from the status endpoint's counters.
 *
 * «7 av 20 ferdige» while it runs; «17 av 20 vurdert, 3 feilet» afterwards. Null when the
 * server reported no run, or an older server reported no counters.
 */
export function describeRunProgress(status: ProjectMatchStatusResponse | null | undefined): string | null {
  if (!status || !status.attempted) return null;
  const { attempted, done = 0, succeeded = 0, failed = 0, skipped = 0 } = status;
  if (status.status === 'RUNNING') return `${done} av ${attempted} ferdige`;
  const parts = [`${succeeded} av ${attempted} vurdert`];
  if (failed > 0) parts.push(`${failed} feilet`);
  if (skipped > 0) parts.push(`${skipped} uten CV-grunnlag`);
  return parts.join(', ');
}
