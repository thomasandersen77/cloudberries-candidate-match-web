import React from 'react';
import { it, expect, vi, beforeEach } from 'vitest';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Routes, Route, useNavigate } from 'react-router-dom';
import CvScoreDetailPage from '../CvScoreDetailPage';
import { getCvScore, recalculateScoreForCandidate } from '../../../services/cvScoreService';
import type { CvScoreDto } from '../../../types/api';

vi.mock('../../../services/cvScoreService', () => ({ getCvScore: vi.fn(), recalculateScoreForCandidate: vi.fn() }));

// Reset, not clear: a queued once-value that a test did not consume must not leak into the next.
beforeEach(() => vi.resetAllMocks());

const scoreOf = (candidateId: string, summary: string): CvScoreDto =>
  ({ candidateId, scorePercent: 70, summary, strengths: [], potentialImprovements: [], stale: false });

const deferred = <T,>() => {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
};

// A plain MemoryRouter: the data router's createMemoryRouter needs a fetch Request jsdom lacks.
const navigate: { to: (path: string) => void } = { to: () => {} };
const Navigator: React.FC = () => {
  navigate.to = useNavigate();
  return null;
};

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Navigator />
      <Routes>
        <Route path="/cv-score/:candidateId" element={<CvScoreDetailPage />} />
      </Routes>
    </MemoryRouter>
  );

/** The effect took whatever answer came last; opened from A to B, a slow A overwrote B. */
it('keeps the score of the candidate on the page when an earlier request answers late', async () => {
  const a = deferred<CvScoreDto>();
  const b = deferred<CvScoreDto>();
  vi.mocked(getCvScore).mockImplementation((id) => (id === 'a' ? a.promise : b.promise));
  renderAt('/cv-score/a');

  await act(async () => { navigate.to('/cv-score/b'); });
  await act(async () => { b.resolve(scoreOf('b', 'Oppsummering for B')); });
  expect(await screen.findByText('Oppsummering for B')).toBeInTheDocument();

  await act(async () => { a.resolve(scoreOf('a', 'Oppsummering for A')); });

  expect(screen.getByText('Oppsummering for B')).toBeInTheDocument();
  expect(screen.queryByText('Oppsummering for A')).not.toBeInTheDocument();
});

/** A failed load left the page with a heading and nothing else. */
it('says when the score could not be loaded and offers to fetch it again without scoring', async () => {
  vi.mocked(getCvScore).mockRejectedValueOnce(new Error('network')).mockResolvedValueOnce(scoreOf('a', 'Hentet på nytt'));
  renderAt('/cv-score/a');

  expect(await screen.findByText(/Kunne ikke hente CV-scoren/)).toBeInTheDocument();
  fireEvent.click(screen.getByRole('button', { name: 'Hent på nytt' }));

  await waitFor(() => expect(screen.getByText('Hentet på nytt')).toBeInTheDocument());
  expect(getCvScore).toHaveBeenCalledTimes(2);
  expect(recalculateScoreForCandidate).not.toHaveBeenCalled();
});

it('shows older scoring rules for an unchanged CV without automatically rescoring', async () => {
  vi.mocked(getCvScore).mockResolvedValueOnce({ candidateId: 'u1', scorePercent: 75, summary: 'Kotlin-utvikler',
    strengths: [], potentialImprovements: [], stale: false, rulesStatus: 'OUTDATED',
    promptVersion: '2026-10-cv-review-v3', currentPromptVersion: '2026-10-cv-review-v5' });
  render(<MemoryRouter initialEntries={['/cv-score/u1']}><Routes>
    <Route path="/cv-score/:candidateId" element={<CvScoreDetailPage />} />
  </Routes></MemoryRouter>);
  expect(await screen.findByText(/Eldre vurderingsregler/)).toBeInTheDocument();
  expect(screen.getByText(/Vurdert med.*v3.*Gjeldende prompt.*v5/)).toBeInTheDocument();
  expect(screen.queryByText(/Skåren er ikke laget fra CV-en/)).not.toBeInTheDocument();
  expect(recalculateScoreForCandidate).not.toHaveBeenCalled();
});
