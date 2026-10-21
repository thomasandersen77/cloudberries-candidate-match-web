import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RequestMatchPage from '../RequestMatchPage';
import { getMatchRequest } from '../../../services/matchesRequestsService';
import { getProjectRequestById } from '../../../services/projectRequestsService';

vi.mock('../../../services/matchesRequestsService', () => ({
  getMatchRequest: vi.fn(),
  listMatchRequests: vi.fn(),
}));
vi.mock('../../../services/projectRequestsService', () => ({
  getProjectRequestById: vi.fn(),
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

const request = {
  id: 9011, customerName: 'NAV', title: 'Tech lead, backend (Kotlin)', summary: 'Tech lead til team for ytelsesplattform.',
  startDate: '2026-11-01T00:00:00Z', endDate: '2027-10-31T00:00:00Z',
  mustRequirements: [
    { name: 'Tilbud leveres i KGV', details: null, appliesTo: 'SUPPLIER' },
    { name: 'Kotlin', details: 'Minst fem års erfaring', appliesTo: 'CONSULTANT' },
  ],
  shouldRequirements: [{ name: 'Grafana', details: null, appliesTo: 'CONSULTANT' }],
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
  beforeEach(() => {
    vi.resetAllMocks();
    panelProps.last = null;
    vi.mocked(getProjectRequestById).mockResolvedValue(request as never);
  });

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

  /** The must-haves the model scores against sit on the page, in the request's words, with their details. */
  it('shows the request itself: period, summary, musts and shoulds with details', async () => {
    vi.mocked(getMatchRequest).mockResolvedValue(item as never);
    renderAt('/matches/9011');

    expect(await screen.findByText('Avropet')).toBeInTheDocument();
    expect(screen.getByText('Periode 1.11.2026 – 31.10.2027')).toBeInTheDocument();
    expect(screen.getByText('Tech lead til team for ytelsesplattform.')).toBeInTheDocument();
    expect(screen.getByText('Må-krav (2)')).toBeInTheDocument();
    expect(screen.getByText('Bør-krav (1)')).toBeInTheDocument();
    expect(screen.getByText('Minst fem års erfaring')).toBeInTheDocument();
    expect(screen.getByText('Leverandør')).toBeInTheDocument();
    // The consultant's requirement is listed before the supplier's, whatever order the request had.
    const musts = screen.getByText('Må-krav (2)').parentElement!.querySelectorAll('li');
    expect(musts[0]).toHaveTextContent('Kotlin');
    expect(musts[1]).toHaveTextContent('Tilbud leveres i KGV');
    expect(screen.getByRole('link', { name: 'Åpne avropet' })).toHaveAttribute('href', '/project-requests/9011');
  });

  it('leaves the request section out when the request cannot be read, and still assesses', async () => {
    vi.mocked(getMatchRequest).mockResolvedValue(item as never);
    vi.mocked(getProjectRequestById).mockRejectedValue(new Error('500'));
    renderAt('/matches/9011');

    expect(await screen.findByText('NAV')).toBeInTheDocument();
    expect(screen.queryByText('Avropet')).not.toBeInTheDocument();
    expect(screen.getByTestId('panel')).toBeInTheDocument();
  });

  it('still offers the assessment when the request is not in the match list', async () => {
    vi.mocked(getMatchRequest).mockResolvedValue(null as never);
    renderAt('/matches/42');

    expect(await screen.findByText(/Fant ikke avropet i matchlisten/)).toBeInTheDocument();
    expect(screen.getByTestId('panel')).toBeInTheDocument();
    expect(panelProps.last).toMatchObject({ requestId: 42, layout: 'page' });
  });
});
