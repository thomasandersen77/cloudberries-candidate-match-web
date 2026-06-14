import type { MatchStatusDto, ProjectMatchStatusResponse } from '../types/api';

/** Frontend-normalized matching lifecycle (Task 10). */
export type FrontendMatchPhase =
  | 'NOT_STARTED'
  | 'READY_FOR_PREVIEW'
  | 'PREVIEW_READY'
  | 'RUNNING'
  | 'COMPLETED'
  | 'FAILED';

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
    case 'FAILED':
      return 'FAILED';
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
    case 'FAILED':
      return 'Feilet';
    default:
      return 'Ukjent';
  }
}
