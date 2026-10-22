import React from 'react';
import { it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import ProjectRequestDetailPage from '../ProjectRequestDetailPage';
import { closeProjectRequest, getProjectRequestById, getProjectRequestSuggestions } from '../../../services/projectRequestsService';

vi.mock('../../../services/projectRequestsService', () => ({
  getProjectRequestById: vi.fn(),
  getProjectRequestSuggestions: vi.fn(),
  analyzeProjectRequest: vi.fn(),
  closeProjectRequest: vi.fn(),
}));

const request = (status: string) => ({ id: 5, customerName: 'Skatteetaten', title: 'Kotlin-utvikler', status, requirements: [] });

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(getProjectRequestSuggestions).mockResolvedValue([]);
});

const renderPage = () =>
  render(
    <MemoryRouter initialEntries={['/project-requests/5']}>
      <Routes>
        <Route path="/project-requests/:id" element={<ProjectRequestDetailPage />} />
      </Routes>
    </MemoryRouter>
  );

/** The close button waited for the answer and dropped it, so the page kept saying OPEN. */
it('shows the request as closed once the server has closed it, and does not offer to close it again', async () => {
  vi.mocked(getProjectRequestById).mockResolvedValue(request('OPEN') as never);
  vi.mocked(closeProjectRequest).mockResolvedValue(request('CLOSED') as never);
  renderPage();

  const close = await screen.findByRole('button', { name: 'Lukk avropet' });
  fireEvent.click(close);

  await waitFor(() => expect(screen.getByText('CLOSED')).toBeInTheDocument());
  expect(screen.getByRole('button', { name: 'Lukk avropet' })).toBeDisabled();
});

it('does not offer to close a request that is already closed', async () => {
  vi.mocked(getProjectRequestById).mockResolvedValue(request('CLOSED') as never);
  renderPage();

  expect(await screen.findByRole('button', { name: 'Lukk avropet' })).toBeDisabled();
});
