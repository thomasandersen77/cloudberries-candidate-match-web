import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../services/cvScoreService', () => {
  const rows = [{ id: 'c1', name: 'Kandidat A', scorePercent: 0, summary: '' }];
  return {
    getAllCandidates: vi.fn().mockResolvedValue([{ id: 'c1', name: 'Kandidat A' }]),
    loadCvScoreListRows: vi.fn().mockImplementation((_c: unknown, cb?: (r: unknown) => void) => {
      cb?.(rows);
      return Promise.resolve(rows);
    }),
    runScoreForCandidate: vi.fn().mockResolvedValue({}),
  };
});

import CvScoreListPage from '../CvScoreListPage';
import { runScoreForCandidate } from '../../../services/cvScoreService';

const mockedRun = runScoreForCandidate as unknown as ReturnType<typeof vi.fn>;
const HIGH_QUALITY_LABEL = 'Bruk høyeste kvalitet';

function renderPage() {
  return render(
    <MemoryRouter>
      <CvScoreListPage />
    </MemoryRouter>
  );
}

describe('CvScoreListPage – høyeste kvalitet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('toggle er av som standard og scorer direkte uten flagg', async () => {
    renderPage();
    expect(await screen.findByText('Kandidat A')).toBeInTheDocument();

    const toggle = screen.getByRole('checkbox', { name: HIGH_QUALITY_LABEL });
    expect(toggle).not.toBeChecked();

    fireEvent.click(screen.getByRole('button', { name: /Kjør scoring for alle/i }));

    // Ingen bekreftelsesdialog når toggle er av
    expect(screen.queryByText(/betydelig mer AI-kreditt/i)).not.toBeInTheDocument();

    await waitFor(() => expect(mockedRun).toHaveBeenCalled());
    expect(mockedRun).toHaveBeenCalledWith('c1', { useHighestQualityModel: false });
  });

  it('viser kostnadsbekreftelse når høyeste kvalitet er valgt, og sender flagg ved Fortsett', async () => {
    renderPage();
    expect(await screen.findByText('Kandidat A')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('checkbox', { name: HIGH_QUALITY_LABEL }));
    fireEvent.click(screen.getByRole('button', { name: /Kjør scoring for alle/i }));

    // Bekreftelse vist; scoring ikke startet ennå
    expect(await screen.findByText(/betydelig mer AI-kreditt/i)).toBeInTheDocument();
    expect(mockedRun).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: /Fortsett/i }));

    await waitFor(() => expect(mockedRun).toHaveBeenCalled());
    expect(mockedRun).toHaveBeenCalledWith('c1', { useHighestQualityModel: true });
  });
});
