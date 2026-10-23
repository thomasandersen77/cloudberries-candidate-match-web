import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import RequestMatchPage from '../RequestMatchPage';
import { getMatchRequest } from '../../../services/matchesRequestsService';
import { getProjectRequestById, reanalyzeDocument } from '../../../services/projectRequestsService';

vi.mock('../../../services/matchesRequestsService', () => ({
  getMatchRequest: vi.fn(),
  listMatchRequests: vi.fn(),
}));
vi.mock('../../../services/projectRequestsService', () => ({
  getProjectRequestById: vi.fn(),
  reanalyzeDocument: vi.fn(),
}));

const panelProps = vi.hoisted(() => ({ last: null as Record<string, unknown> | null }));
vi.mock('../../../components/matches/RequestMatchPanel', () => ({
  default: (props: Record<string, unknown>) => { panelProps.last = props; return <div data-testid="panel">panel</div>; },
}));

const item = {
  id: 9011, title: 'Tech lead, backend (Kotlin)', role: 'Tech lead', customerName: 'NAV', date: '2026-09-18', deadlineDate: '2026-10-02',
  coverageStatus: 'AMBER', coverageLabel: '1 har treff på alle må-krav',
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

  /** The page loads the request and its list row and hands both to the panel, which lays the page out (plan C1). */
  it('hands the request and its list row to the panel in page layout', async () => {
    vi.mocked(getMatchRequest).mockResolvedValue(item as never);
    renderAt('/matches/9011');

    await waitFor(() => expect(panelProps.last).toMatchObject({
      requestId: 9011, layout: 'page', item: { customerName: 'NAV' }, request: { id: 9011, customerName: 'NAV' },
    }));
    expect(screen.getByRole('link', { name: 'Tilbake til matcher' })).toHaveAttribute('href', '/matches');
  });

  it('still assesses when the request itself cannot be read', async () => {
    vi.mocked(getMatchRequest).mockResolvedValue(item as never);
    vi.mocked(getProjectRequestById).mockRejectedValue(new Error('500'));
    renderAt('/matches/9011');

    await waitFor(() => expect(panelProps.last).toMatchObject({ requestId: 9011, item: { customerName: 'NAV' } }));
    expect(panelProps.last?.request).toBeNull();
    expect(screen.getByTestId('panel')).toBeInTheDocument();
  });

  /** The request had two pages; old links and bookmarks to the second land on the one there is now. */
  it('sends /project-requests/{id} to the request page', async () => {
    const { default: RedirectToRequestPage } = await import('../../../routes/RedirectToRequestPage');
    render(
      <MemoryRouter initialEntries={['/project-requests/9011']}>
        <Routes>
          <Route path="/project-requests/:id" element={<RedirectToRequestPage />} />
          <Route path="/matches/:id" element={<div data-testid="request-page">avrop</div>} />
        </Routes>
      </MemoryRouter>
    );
    expect(await screen.findByTestId('request-page')).toBeInTheDocument();
  });

  it('still offers the assessment when the request is not in the match list', async () => {
    vi.mocked(getMatchRequest).mockResolvedValue(null as never);
    renderAt('/matches/42');

    expect(await screen.findByText(/Fant ikke avropet i matchlisten/)).toBeInTheDocument();
    expect(screen.getByTestId('panel')).toBeInTheDocument();
    expect(panelProps.last).toMatchObject({ requestId: 42, layout: 'page' });
  });

  /** «Tilbake» led to a plain /matches, so a filtered list was lost on every round trip. */
  it('leads back to the list it was opened from, filters and page included', async () => {
    vi.mocked(getMatchRequest).mockResolvedValue(item as never);
    render(
      <MemoryRouter initialEntries={[{ pathname: '/matches/9011', state: { listSearch: 'assessed=true&page=1' } }]}>
        <Routes>
          <Route path="/matches/:id" element={<RequestMatchPage />} />
        </Routes>
      </MemoryRouter>
    );

    expect(await screen.findByRole('link', { name: 'Tilbake til matcher' })).toHaveAttribute('href', '/matches?assessed=true&page=1');
  });

  /**
   * A failed analysis left a request with an unknown customer and no requirements, looking like one
   * that asks for nothing. The page says so, and «Prøv igjen» reads the stored document again.
   */
  it('says the requirements were not read, and reads them again on «Prøv igjen»', async () => {
    vi.mocked(getMatchRequest).mockResolvedValue(item as never);
    vi.mocked(getProjectRequestById).mockResolvedValueOnce({
      ...request, customerName: 'Unknown Customer', mustRequirements: [], shouldRequirements: [],
      analysisStatus: 'FAILED', analysisError: 'AI-tjenesten feilet under tolkingen.',
    } as never);
    vi.mocked(reanalyzeDocument).mockResolvedValue(undefined);
    renderAt('/matches/9011');

    expect(await screen.findByText(/kravtolkingen feilet, så avropet har ingen krav ennå/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Prøv igjen' }));

    await waitFor(() => expect(reanalyzeDocument).toHaveBeenCalledWith(9011));
    await waitFor(() => expect(screen.queryByText(/kravtolkingen feilet/)).not.toBeInTheDocument());
    expect(getProjectRequestById).toHaveBeenCalledTimes(2);
  });

  it('keeps the warning and says so when the second analysis fails too', async () => {
    vi.mocked(getMatchRequest).mockResolvedValue(item as never);
    vi.mocked(getProjectRequestById).mockResolvedValue({ ...request, analysisStatus: 'FAILED', analysisError: null } as never);
    vi.mocked(reanalyzeDocument).mockRejectedValue({
      response: { status: 502, data: { error: 'REQUEST_ANALYSIS_FAILED', message: 'Kravtolkingen feilet igjen for avrop 9011. Dokumentet er lagret; prøv igjen senere.' } },
    });
    renderAt('/matches/9011');

    fireEvent.click(await screen.findByRole('button', { name: 'Prøv igjen' }));

    expect(await screen.findByText(/Kravtolkingen feilet igjen for avrop 9011/)).toBeInTheDocument();
  });
});

