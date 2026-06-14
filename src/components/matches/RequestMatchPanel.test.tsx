import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RequestMatchPanel from './RequestMatchPanel';

const renderPanel = () =>
  render(
    <MemoryRouter>
      <RequestMatchPanel requestId={1} hitCount={5} />
    </MemoryRouter>,
  );

vi.mock('../../api/matchingApi', () => ({
  getProjectMatchStatus: vi.fn().mockResolvedValue({ projectRequestId: 1, status: 'NOT_STARTED' }),
  getProjectMatchResults: vi.fn().mockResolvedValue(null),
  previewProjectMatches: vi.fn().mockResolvedValue({
    projectRequestId: 1,
    semanticSearchReady: true,
    candidates: [{ userId: 'u1', name: 'Kari', combinedScore: 0.8, reason: 'God overlap' }],
  }),
  runProjectMatching: vi.fn().mockResolvedValue({
    projectRequestId: 1,
    matches: [{ userId: 'u1', name: 'Kari', cvId: 'c1', score: 90, justification: 'God match' }],
    lastUpdated: '2026-01-01T12:00:00Z',
  }),
}));

vi.mock('../../services/consultantsService', () => ({
  getEmbeddingInfo: vi.fn().mockResolvedValue({ enabled: true, semanticSearchReady: false }),
}));

describe('RequestMatchPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not call preview or run on mount — only status/results', async () => {
    const api = await import('../../api/matchingApi');
    renderPanel();
    await waitFor(() => expect(api.getProjectMatchStatus).toHaveBeenCalled());
    expect(api.getProjectMatchResults).toHaveBeenCalled();
    expect(api.previewProjectMatches).not.toHaveBeenCalled();
    expect(api.runProjectMatching).not.toHaveBeenCalled();
  });

  it('high quality toggle defaults to off', async () => {
    render(
      <MemoryRouter>
        <RequestMatchPanel requestId={1} />
      </MemoryRouter>,
    );
    await waitFor(() => screen.getByRole('checkbox', { name: /Bruk høyeste kvalitet/i }));
    expect(screen.getByRole('checkbox', { name: /Bruk høyeste kvalitet/i })).not.toBeChecked();
  });

  it('preview and run are separate explicit actions', async () => {
    const api = await import('../../api/matchingApi');
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RequestMatchPanel requestId={1} />
      </MemoryRouter>,
    );
    await waitFor(() => screen.getByRole('button', { name: /Forhåndsvis kandidater/i }));

    await user.click(screen.getByRole('button', { name: /Forhåndsvis kandidater/i }));
    await waitFor(() => expect(api.previewProjectMatches).toHaveBeenCalled());
    expect(api.runProjectMatching).not.toHaveBeenCalled();

    await user.click(screen.getByRole('button', { name: /^Kjør AI-matching$/i }));
    await waitFor(() => expect(api.runProjectMatching).toHaveBeenCalled());
  });

  it('shows confirmation when running with highest quality', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RequestMatchPanel requestId={1} />
      </MemoryRouter>,
    );
    await waitFor(() => screen.getByRole('checkbox', { name: /Bruk høyeste kvalitet/i }));
    await user.click(screen.getByRole('checkbox', { name: /Bruk høyeste kvalitet/i }));
    await user.click(screen.getByRole('button', { name: /^Kjør AI-matching$/i }));
    expect(await screen.findByText(/Dette kan bruke betydelig mer AI-kreditt/i)).toBeInTheDocument();
  });
});
