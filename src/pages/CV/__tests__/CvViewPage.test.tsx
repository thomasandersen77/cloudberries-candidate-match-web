import React from 'react';
import { it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import CvViewPage from '../CvViewPage';
import { getConsultantWithCv, listConsultantsWithCv } from '../../../services/consultantsService';

vi.mock('../../../services/consultantsService', () => ({
  getConsultantWithCv: vi.fn(),
  listConsultantsWithCv: vi.fn(),
  syncSingleConsultant: vi.fn(),
}));

beforeEach(() => vi.resetAllMocks());

const renderAt = (userId: string) =>
  render(
    <MemoryRouter initialEntries={[`/cv/${userId}`]}>
      <Routes>
        <Route path="/cv/:userId" element={<CvViewPage />} />
      </Routes>
    </MemoryRouter>
  );

/**
 * The page loaded every active consultant and looked for the id in the browser, so a historical
 * link to somebody who has left said «Konsulent ikke funnet» although the backend answers for
 * them by id. One person per lookup now, through the id endpoint.
 */
it('loads one consultant by id, not the whole corpus', async () => {
  vi.mocked(getConsultantWithCv).mockResolvedValue({
    userId: 'gone', name: 'Sluttet Sørensen', cvId: 'cv-gone', skills: [], cvs: [{ active: true, qualityScore: 70 }],
  } as never);
  renderAt('gone');

  expect(await screen.findByText('CV - Sluttet Sørensen')).toBeInTheDocument();
  expect(listConsultantsWithCv).not.toHaveBeenCalled();
});

it('says when the consultant does not exist', async () => {
  vi.mocked(getConsultantWithCv).mockRejectedValue({ response: { status: 404 } });
  renderAt('nobody');

  expect(await screen.findByText(/Konsulent ikke funnet/)).toBeInTheDocument();
});
