import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import SyncResultSummary from './SyncResultSummary';
import { describeSyncResult } from './syncResultText';
import type { ConsultantSyncResponse } from '../../types/api';

afterEach(() => cleanup());

/** The response of a run where Flowcase reported nothing new, as measured on 2026-09-17. */
const quietRun: ConsultantSyncResponse = {
  total: 104,
  totalInDatabase: 120,
  attempted: 104,
  succeeded: 104,
  failed: 0,
  skipped: 0,
  created: 0,
  updated: 0,
  unchanged: 104,
  departed: 0,
  returned: 0,
  skippedReasons: {},
  embeddings: { vectorsDeleted: 15, chunksDeleted: 213, wholeCv: null, chunks: null },
};

/** The first run after the departure work: people created, updated, departed, and CVs re-embedded. */
const busyRun: ConsultantSyncResponse = {
  total: 104,
  totalInDatabase: 118,
  attempted: 104,
  succeeded: 102,
  failed: 1,
  skipped: 1,
  created: 2,
  updated: 3,
  unchanged: 97,
  departed: 16,
  returned: 1,
  skippedReasons: { missingFlowcaseUserIdOrCv: 1 },
  embeddings: {
    vectorsDeleted: 0,
    chunksDeleted: 0,
    wholeCv: { processed: 104, created: 2, updated: 3, skipped: 99, failed: 0, provider: 'GOOGLE_GEMINI', model: 'gemini-embedding-001', dimension: 768 },
    chunks: { processed: 104, created: 2, updated: 3, skipped: 98, failed: 0, rateLimited: 1, totalChunks: 61, provider: 'GOOGLE_GEMINI', model: 'gemini-embedding-001' },
  },
};

/** dt text -> the dd next to it. */
function valueOf(label: string): string | null | undefined {
  return screen.getByText(label, { selector: 'dt' }).nextElementSibling?.textContent;
}

describe('describeSyncResult', () => {
  it('reads as one quiet sentence when nothing changed', () => {
    expect(describeSyncResult(quietRun)).toBe('104 konsulenter i Flowcase. Ingen CV-er var endret.');
  });

  it('names what changed, who left, and what did not go through', () => {
    expect(describeSyncResult(busyRun)).toBe(
      '104 konsulenter i Flowcase. 2 nye konsulenter og 3 oppdaterte CV-er. 16 har sluttet. 1 er tilbake. 1 hoppet over. 1 feilet.'
    );
  });

  it('uses the singular for one', () => {
    expect(describeSyncResult({ ...quietRun, total: 1, created: 1, unchanged: 0 })).toBe(
      '1 konsulent i Flowcase. 1 ny konsulent.'
    );
  });
});

describe('SyncResultSummary', () => {
  it('shows the people rows and says the provider was not called on a quiet run', () => {
    render(<SyncResultSummary result={quietRun} />);

    expect(valueOf('Nye')).toBe('0');
    expect(valueOf('Uendret CV')).toBe('104');
    expect(valueOf('Sluttet')).toBe('0');
    expect(screen.queryByText('Tilbake', { selector: 'dt' })).not.toBeInTheDocument();
    expect(screen.queryByText('Feilet', { selector: 'dt' })).not.toBeInTheDocument();

    expect(valueOf('Fjernet for dem som har sluttet')).toBe('15 hel-CV-vektorer, 213 biter');
    expect(valueOf('Nye vektorer')).toBe('ingen, siden ingen CV var endret');
  });

  it('shows the optional rows, the skip reason in words, and both rebuilds', () => {
    render(<SyncResultSummary result={busyRun} />);

    expect(valueOf('Tilbake')).toBe('1');
    expect(valueOf('Hoppet over')).toBe('1 (1 mangler CV i Flowcase)');
    expect(valueOf('Feilet')).toBe('1');

    expect(valueOf('Fjernet for dem som har sluttet')).toBe('ingen');
    expect(valueOf('Hel-CV-vektorer')).toBe('2 nye, 3 oppdatert, 99 uendret');
    expect(valueOf('Biter')).toBe('5 CV-er på nytt (61 biter), 98 uendret');
    expect(screen.getByText(/stoppet kjøringen på kvote/)).toBeInTheDocument();
  });

  it('says so when embeddings are off instead of showing an empty section', () => {
    render(<SyncResultSummary result={{ ...quietRun, embeddings: null }} />);

    expect(valueOf('Ikke rørt')).toBe('embeddings er slått av');
    expect(screen.queryByText('Fjernet for dem som har sluttet', { selector: 'dt' })).not.toBeInTheDocument();
  });

  it('never renders the raw JSON', () => {
    const { container } = render(<SyncResultSummary result={busyRun} />);
    expect(container.querySelector('pre')).toBeNull();
    expect(container.textContent).not.toContain('"departed"');
  });
});
