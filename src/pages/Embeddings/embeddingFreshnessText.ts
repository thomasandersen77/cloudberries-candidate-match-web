import type { EmbeddingState } from '../../types/api';

export const STATE_LABEL: Record<EmbeddingState, string> = {
  MISSING: 'Mangler',
  STALE: 'Utdatert',
  CURRENT: 'Oppdatert',
  NOTHING_TO_EMBED: 'Ingen tekst',
};

export const STATE_COLOR: Record<EmbeddingState, 'error' | 'warning' | 'success' | 'default'> = {
  MISSING: 'error',
  STALE: 'warning',
  CURRENT: 'success',
  NOTHING_TO_EMBED: 'default',
};

export function formatEmbeddedAt(iso?: string | null): string {
  if (!iso) return '–';
  const d = new Date(iso);
  return isNaN(d.getTime()) ? '–' : d.toLocaleString('nb-NO', { dateStyle: 'short', timeStyle: 'short' });
}

/** A request the browser gave up on; the rebuild goes on on the server. */
export function isTimeout(error: unknown): boolean {
  const e = error as { code?: string; message?: string };
  return e?.code === 'ECONNABORTED' || /timeout/i.test(e?.message ?? '');
}
