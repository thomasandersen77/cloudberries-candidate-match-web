import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MatchesPage from '../MatchesPage';

vi.mock('../../../services/matchesRequestsService', async () => {
  return {
    listMatchRequests: vi.fn().mockResolvedValue({
      content: [
        { id: 1, title: 'Forespørsel A', customerName: 'Kunde A', date: '2025-01-01T10:00:00Z', hitCount: 12, coverageStatus: 'GREEN', coverageLabel: 'God dekning' },
      ],
      currentPage: 0,
      totalPages: 1,
      pageSize: 20,
      hasNext: false,
      hasPrevious: false,
    }),
    getTopConsultantsForRequest: vi.fn().mockResolvedValue([
      { consultantName: 'Ola', userId: 'ola', matchScore: 95.1, skills: ['JAVA', 'KOTLIN'], justification: 'Overlapper med krav' },
    ]),
  };
});

describe('MatchesPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('viser sorteringslabel og størrelse-knapper, og laster første side', async () => {
    render(<MatchesPage />);
    expect(await screen.findByText(/Matcher/i)).toBeInTheDocument();
    expect(screen.getByText(/Sortering: nyeste først/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '10' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '20' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '50' })).toBeInTheDocument();

    // Viser rad med dekningschip
    expect(await screen.findByText('God dekning')).toBeInTheDocument();
  });

  it('endrer side-størrelse ved klikk', async () => {
    const mod = await import('../../../services/matchesRequestsService');
    const spy = vi.spyOn(mod, 'listMatchRequests');

    render(<MatchesPage />);
    await waitFor(() => expect(spy).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: '50' }));

    await waitFor(() => {
      // kall nummer 2 bør ha size=50
      expect(spy).toHaveBeenCalledTimes(2);
      const [, secondCallArgs] = spy.mock.calls;
      expect(secondCallArgs?.[0]?.size).toBe(50);
    });
  });
});
