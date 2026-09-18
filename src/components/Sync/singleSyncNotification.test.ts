import { describe, it, expect } from 'vitest';
import { describeVectorRefresh, singleSyncNotification, singleSyncProgressNotification } from './singleSyncNotification';
import type { ConsultantSyncResponse } from '../../types/api';

const base: ConsultantSyncResponse = {
  total: 1,
  totalInDatabase: 120,
  attempted: 1,
  succeeded: 0,
  failed: 0,
  skipped: 0,
  created: 0,
  updated: 0,
  unchanged: 0,
  departed: 0,
  returned: 0,
  skippedReasons: {},
  embeddings: null,
};

describe('singleSyncNotification', () => {
  it('is a success when the CV was written', () => {
    const n = singleSyncNotification({ ...base, succeeded: 1, updated: 1 });
    expect(n.type).toBe('success');
    expect(n.title).toBe('CV oppdatert');
    expect(n.details).toEqual({ processed: true });
  });

  it('says so when the person was new here', () => {
    const n = singleSyncNotification({ ...base, succeeded: 1, created: 1 });
    expect(n.type).toBe('success');
    expect(n.message).toMatch(/ny her/);
  });

  it('warns, and does not claim an update, when Flowcase no longer has the person', () => {
    const n = singleSyncNotification({ ...base, skipped: 1, skippedReasons: { missingFlowcaseUserIdOrCv: 1 } });
    expect(n.type).toBe('info');
    expect(n.title).not.toBe('CV oppdatert');
    expect(n.details).toEqual({ processed: false });
  });

  it('is an error when the backend reports a failure with status 200', () => {
    const n = singleSyncNotification({ ...base, failed: 1 });
    expect(n.type).toBe('error');
    expect(n.title).toBe('Oppdatering feilet');
  });

  it('says what happened to the vectors, in the success notice', () => {
    const n = singleSyncNotification({ ...base, succeeded: 1, updated: 1, embeddings: refresh({ whole: { updated: 1 }, chunks: { updated: 1 } }) });
    expect(n.message).toMatch(/Søkevektorene er oppdatert/);
  });
});

const gemini = { provider: 'GOOGLE_GEMINI', model: 'gemini-embedding-001' };
function refresh(o: { whole?: Partial<{ processed: number; created: number; updated: number; skipped: number; failed: number }>; chunks?: Partial<{ processed: number; created: number; updated: number; skipped: number; failed: number; rateLimited: number }> }): NonNullable<ConsultantSyncResponse['embeddings']> {
  return {
    vectorsDeleted: 0,
    chunksDeleted: 0,
    wholeCv: o.whole ? { processed: 1, created: 0, updated: 0, skipped: 0, failed: 0, dimension: 768, ...gemini, ...o.whole } : null,
    chunks: o.chunks ? { processed: 1, created: 0, updated: 0, skipped: 0, failed: 0, rateLimited: 0, totalChunks: 0, ...gemini, ...o.chunks } : null,
  };
}

describe('describeVectorRefresh', () => {
  it('says the vectors were written when either rebuild wrote', () => {
    expect(describeVectorRefresh(refresh({ whole: { updated: 1 }, chunks: { skipped: 1 } }))).toMatch(/er oppdatert/);
  });

  it('says no provider was called when both rebuilds skipped by hash', () => {
    expect(describeVectorRefresh(refresh({ whole: { skipped: 1 }, chunks: { skipped: 1 } }))).toMatch(/ingen kall/);
  });

  it('says why when nobody was processed', () => {
    expect(describeVectorRefresh(refresh({ whole: { processed: 0 }, chunks: { processed: 0 } }))).toMatch(/ikke innhold nok/);
  });

  it('names the quota stop and the failure', () => {
    expect(describeVectorRefresh(refresh({ whole: { skipped: 1 }, chunks: { rateLimited: 1 } }))).toMatch(/kvote/);
    expect(describeVectorRefresh(refresh({ whole: { failed: 1 }, chunks: { skipped: 1 } }))).toMatch(/kunne ikke/);
  });

  it('says so when embeddings are off', () => {
    expect(describeVectorRefresh(null)).toMatch(/slått av/);
  });
});

describe('singleSyncProgressNotification', () => {
  it('says what runs, and that no language model reads the CV', () => {
    const n = singleSyncProgressNotification();
    expect(n.type).toBe('progress');
    expect(n.message).toMatch(/Ingen språkmodell/);
  });
});
