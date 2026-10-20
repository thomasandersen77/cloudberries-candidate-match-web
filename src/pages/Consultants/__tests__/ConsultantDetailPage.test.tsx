import React from 'react';
import { it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ConsultantDetailPage from '../ConsultantDetailPage';
import { getConsultantWithCv, listConsultantsWithCv } from '../../../services/consultantsService';

vi.mock('../../../services/consultantsService', () => ({
  getConsultantWithCv: vi.fn(),
  listConsultantsWithCv: vi.fn(),
  syncSingleConsultant: vi.fn(),
}));

beforeEach(() => vi.resetAllMocks());

const renderAt = (userId: string) =>
  render(
    <MemoryRouter initialEntries={[`/consultants/${userId}`]}>
      <Routes>
        <Route path="/consultants/:userId" element={<ConsultantDetailPage />} />
      </Routes>
    </MemoryRouter>
  );

/** Same lookup as the CV page: by id, so a departed consultant's page still opens. */
it('loads one consultant by id, not the whole corpus', async () => {
  vi.mocked(getConsultantWithCv).mockResolvedValue({
    userId: 'gone', name: 'Sluttet Sørensen', cvId: 'cv-gone', skills: [], cvs: [{ active: true, qualityScore: 70 }],
  } as never);
  renderAt('gone');

  expect(await screen.findByRole('heading', { level: 1, name: /Sluttet Sørensen/ })).toBeInTheDocument();
  expect(listConsultantsWithCv).not.toHaveBeenCalled();
});

it('says when the consultant does not exist', async () => {
  vi.mocked(getConsultantWithCv).mockRejectedValue({ response: { status: 404 } });
  renderAt('nobody');

  expect(await screen.findByText(/Konsulent ikke funnet/)).toBeInTheDocument();
});
