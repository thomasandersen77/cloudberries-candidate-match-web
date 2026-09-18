import { describe, it, expect } from 'vitest';
import { singleSyncNotification } from './singleSyncNotification';
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
});
