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

/**
 * An unchanged CV under the same prompt is not scored again for nothing: the server says so with
 * 409 CV_SCORE_UNCHANGED, the page shows it, and «Score likevel» asks again with force.
 */
it('says when the CV and the prompt are unchanged, and scores anyway only when asked', async () => {
  vi.mocked(getCvScore).mockResolvedValueOnce(scoreOf('u1', 'Kotlin-utvikler'));
  vi.mocked(recalculateScoreForCandidate)
    .mockRejectedValueOnce({ response: { status: 409, data: { error: 'CV_SCORE_UNCHANGED', message: 'CV-en til Kari er uendret siden forrige scoring.' } } })
    .mockResolvedValueOnce(scoreOf('u1', 'Ny vurdering'));
  renderAt('/cv-score/u1');

  fireEvent.click(await screen.findByRole('button', { name: 'Score på nytt' }));

  expect(await screen.findByText('CV-en til Kari er uendret siden forrige scoring.')).toBeInTheDocument();
  expect(recalculateScoreForCandidate).toHaveBeenLastCalledWith('u1', undefined);

  fireEvent.click(screen.getByRole('button', { name: 'Score likevel' }));

  await waitFor(() => expect(recalculateScoreForCandidate).toHaveBeenLastCalledWith('u1', { force: true }));
  expect(await screen.findByText('Ny vurdering')).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Score likevel' })).not.toBeInTheDocument();
});

it('says another scoring of the CV is running, as information and not as a failure', async () => {
  vi.mocked(getCvScore).mockResolvedValueOnce(scoreOf('u1', 'Kotlin-utvikler'));
  vi.mocked(recalculateScoreForCandidate).mockRejectedValueOnce({
    response: { status: 409, data: { error: 'CV_SCORE_IN_PROGRESS', message: 'Scoring av CV-en til Kari pågår allerede (manuell, startet 14:02).' } },
  });
  renderAt('/cv-score/u1');

  fireEvent.click(await screen.findByRole('button', { name: 'Score på nytt' }));

  expect(await screen.findByText(/pågår allerede/)).toBeInTheDocument();
  expect(screen.queryByRole('button', { name: 'Score likevel' })).not.toBeInTheDocument();
});
