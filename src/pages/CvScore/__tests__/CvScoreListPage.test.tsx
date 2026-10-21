import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

const listRows = vi.hoisted(() => ({
  current: [{ id: 'c1', name: 'Kandidat A', scorePercent: 0, summary: '' }] as Array<Record<string, unknown>>,
}));

vi.mock('../../../services/cvScoreService', () => {
  return {
    getAllCandidates: vi.fn().mockResolvedValue([{ id: 'c1', name: 'Kandidat A' }]),
    loadCvScoreListRows: vi.fn().mockImplementation((_c: unknown, cb?: (r: unknown) => void) => {
      cb?.(listRows.current);
      return Promise.resolve(listRows.current);
    }),
    runScoreForCandidate: vi.fn().mockResolvedValue({}),
  };
});

import CvScoreListPage from '../CvScoreListPage';
import { runScoreForCandidate } from '../../../services/cvScoreService';

const mockedRun = runScoreForCandidate as unknown as ReturnType<typeof vi.fn>;

function renderPage() {
  return render(
    <MemoryRouter>
      <CvScoreListPage />
    </MemoryRouter>
  );
}

describe('CvScoreListPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listRows.current = [{ id: 'c1', name: 'Kandidat A', scorePercent: 0, summary: '' }];
  });

  /** Every CV is scored on the one fixed tier, so the page offers no choice and asks nothing. */
  it('scores on the fixed tier with no model choice and no confirmation', async () => {
    renderPage();
    expect(await screen.findByText('Kandidat A')).toBeInTheDocument();

    expect(screen.queryByRole('checkbox', { name: /høyeste kvalitet/i })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Kjør scoring for alle/i }));

    await waitFor(() => expect(mockedRun).toHaveBeenCalled());
    expect(mockedRun).toHaveBeenCalledWith('c1');
    expect(screen.queryByText(/betydelig mer AI-kreditt/i)).not.toBeInTheDocument();
  });

});

/**
 * Empty CVs and stale scores. Ten managers and administration accounts had a score for an empty
 * Flowcase skeleton, and 48 rows were reviews of another consultant's CV; neither was visible.
 */
describe('CvScoreListPage – vurderbare og utdaterte', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    listRows.current = [
      { id: 'a', name: 'Med Prosjekter', scorePercent: 80, summary: '', assessable: true, stale: false },
      { id: 'b', name: 'Gammel Skår', scorePercent: 78, summary: '', assessable: true, stale: true },
      { id: 'c', name: 'Uten Skår', scorePercent: 0, summary: '', assessable: true, stale: false },
      { id: 'v', name: 'Vivi Elton', scorePercent: 0, summary: '', assessable: false, stale: false },
    ];
  });

  it('leaves out CVs with nothing to review, and says how many', async () => {
    renderPage();
    expect(await screen.findByText('Med Prosjekter')).toBeInTheDocument();

    expect(screen.queryByText('Vivi Elton')).not.toBeInTheDocument();
    expect(screen.getByText(/1 uten CV-innhold vises ikke/)).toBeInTheDocument();
  });

  it('marks a score that was not made from the current CV', async () => {
    renderPage();
    expect(await screen.findByText('Gammel Skår')).toBeInTheDocument();

    expect(screen.getAllByText('Utdatert', { selector: '.MuiChip-label' })).toHaveLength(1);
  });

  it('does not send a CV with nothing to review when scoring the missing ones', async () => {
    renderPage();
    expect(await screen.findByText('Uten Skår')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Kjør scoring for alle/i }));

    // Wait for the whole run, not the first call: the old page sent Vivi second.
    expect(await screen.findByText(/Scoring fullført/)).toBeInTheDocument();
    expect(mockedRun).toHaveBeenCalledTimes(1);
    expect(mockedRun).toHaveBeenCalledWith('c');
    expect(mockedRun).not.toHaveBeenCalledWith('v', expect.anything());
  });
});
