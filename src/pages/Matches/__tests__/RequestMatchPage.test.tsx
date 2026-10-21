import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RequestMatchPage from '../RequestMatchPage';
import { getMatchRequest } from '../../../services/matchesRequestsService';

vi.mock('../../../services/matchesRequestsService', () => ({
  getMatchRequest: vi.fn(),
  listMatchRequests: vi.fn(),
}));

const panelProps = vi.hoisted(() => ({ last: null as Record<string, unknown> | null }));
vi.mock('../../../components/matches/RequestMatchPanel', () => ({
  default: (props: Record<string, unknown>) => { panelProps.last = props; return <div data-testid="panel">panel</div>; },
}));

const item = {
  id: 9011, title: 'Tech lead, backend (Kotlin)', role: 'Tech lead', customerName: 'NAV', date: '2026-09-18', deadlineDate: '2026-10-02',
  coverageStatus: 'AMBER', coverageLabel: '1 dekker alle må-krav',
  coverage: {
    technologyRequirements: 2, covered: 2, fullMatchCount: 1, fullMatchBasis: 'MUST', fullMatchNames: ['Ayhan Ileri'],
    requirements: [
      { name: 'Kotlin', priority: 'MUST', skills: ['KOTLIN'], consultants: 24, projectOnly: 0 },
      { name: 'Grafana', priority: 'SHOULD', skills: ['GRAFANA'], consultants: 25, projectOnly: 0 },
    ],
    otherRequirements: [],
  },
  aiMatchCount: 15, aiLastUpdated: '2026-10-21T07:52:00Z',
};

const renderAt = (path: string) =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/matches/:id" element={<RequestMatchPage />} />
      </Routes>
    </MemoryRouter>
  );

describe('RequestMatchPage', () => {
  beforeEach(() => { vi.resetAllMocks(); panelProps.last = null; });

  /** The assessment is the answer, so the page puts it first and explains the steps above it. */
  it('shows the request, how the matching works, and the panel in page layout', async () => {
    vi.mocked(getMatchRequest).mockResolvedValue(item as never);
    renderAt('/matches/9011');

    expect(await screen.findByText('NAV')).toBeInTheDocument();
    expect(screen.getByText('Slik fungerer matchingen')).toBeInTheDocument();
    expect(screen.getByText('1. Forutvalg uten AI')).toBeInTheDocument();
    expect(screen.getByText('2. AI-vurdering')).toBeInTheDocument();
    expect(screen.getByText('3. Rekkefølge og forslag')).toBeInTheDocument();
    expect(screen.getByTestId('panel')).toBeInTheDocument();
    expect(panelProps.last).toMatchObject({ requestId: 9011, layout: 'page' });
    // Should-haves are on the page too, not only the musts the list card shows.
    expect(screen.getByText('Grafana 25')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Tilbake til matcher' })).toHaveAttribute('href', '/matches');
  });

  it('still offers the assessment when the request is not in the match list', async () => {
    vi.mocked(getMatchRequest).mockResolvedValue(null as never);
    renderAt('/matches/42');

    expect(await screen.findByText(/Fant ikke avropet i matchlisten/)).toBeInTheDocument();
    expect(screen.getByTestId('panel')).toBeInTheDocument();
    expect(panelProps.last).toMatchObject({ requestId: 42, layout: 'page' });
  });
});
