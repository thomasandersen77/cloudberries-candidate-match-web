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
    candidates: [
      { userId: 'u1', name: 'Kari', combinedScore: 0.8, reason: 'God overlap' },
      { userId: 'u2', name: 'Ola', combinedScore: 0.72, reason: 'Delvis overlap' },
      { userId: 'u3', name: 'Nina', combinedScore: 0.69, reason: 'Svak overlap' },
    ],
  }),
  runProjectMatching: vi.fn().mockResolvedValue({
    projectRequestId: 1,
    matches: [
      {
        userId: 'u1',
        name: 'Thomas Andersen',
        cvId: 'c1',
        score: 8.3,
        scorePercent: 83,
        justification: 'God match med lang begrunnelse som skal vises når raden utvides.',
      },
      {
        userId: 'u2',
        name: 'Stine Holst',
        cvId: 'c2',
        score: 7.5,
        scorePercent: 75,
        justification: 'Sterk profil med relevant erfaring.',
      },
    ],
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

    // Everything previewed is ticked by default, so the button carries the count.
    await user.click(screen.getByRole('button', { name: /^Kjør AI-matching \(3\)$/i }));
    await waitFor(() => expect(api.runProjectMatching).toHaveBeenCalled());
  });

  it('sends only the ticked candidates to the AI', async () => {
    // Preselection ranks for recall, and its order predicts the LLM's poorly, so who goes to the
    // model is the operator's call rather than the score's.
    const api = await import('../../api/matchingApi');
    const user = userEvent.setup();
    renderPanel();
    await waitFor(() => screen.getByRole('button', { name: /Forhåndsvis kandidater/i }));
    await user.click(screen.getByRole('button', { name: /Forhåndsvis kandidater/i }));
    await screen.findByText(/3 av 3 valgt/);

    await user.click(screen.getByRole('checkbox', { name: /Ta med Ola i AI-vurderingen/i }));
    expect(await screen.findByText(/2 av 3 valgt/)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Kjør AI-matching \(2\)$/i }));

    await waitFor(() => expect(api.runProjectMatching).toHaveBeenCalled());
    expect(vi.mocked(api.runProjectMatching).mock.calls[0][1]).toMatchObject({
      consultantUserIds: ['u1', 'u3'],
    });
  });

  it('lets the operator clear and restore the whole selection', async () => {
    const user = userEvent.setup();
    renderPanel();
    await waitFor(() => screen.getByRole('button', { name: /Forhåndsvis kandidater/i }));
    await user.click(screen.getByRole('button', { name: /Forhåndsvis kandidater/i }));
    await screen.findByText(/3 av 3 valgt/);

    await user.click(screen.getByRole('button', { name: /Fjern alle/i }));
    expect(await screen.findByText(/0 av 3 valgt/)).toBeInTheDocument();
    // Running zero candidates would spend a request on nothing.
    expect(screen.getByRole('button', { name: /^Kjør AI-matching$/i })).toBeDisabled();

    await user.click(screen.getByRole('button', { name: /Velg alle/i }));
    expect(await screen.findByText(/3 av 3 valgt/)).toBeInTheDocument();
  });

  it('leaves the shortlist to the backend when there is no preview', async () => {
    const api = await import('../../api/matchingApi');
    const user = userEvent.setup();
    renderPanel();
    await waitFor(() => screen.getByRole('button', { name: /^Kjør AI-matching$/i }));

    await user.click(screen.getByRole('button', { name: /^Kjør AI-matching$/i }));

    await waitFor(() => expect(api.runProjectMatching).toHaveBeenCalled());
    expect(vi.mocked(api.runProjectMatching).mock.calls[0][1]).toMatchObject({
      consultantUserIds: [],
    });
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

  it('renders decimal AI match scores without integer truncation', async () => {
    const api = await import('../../api/matchingApi');
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RequestMatchPanel requestId={1} />
      </MemoryRouter>,
    );
    await waitFor(() => screen.getByRole('button', { name: /^Kjør AI-matching$/i }));
    await user.click(screen.getByRole('button', { name: /^Kjør AI-matching$/i }));
    await waitFor(() => expect(api.runProjectMatching).toHaveBeenCalled());
    expect(await screen.findByText(/Thomas Andersen/)).toBeInTheDocument();
    expect(screen.getByText(/score 8\.3/)).toBeInTheDocument();
    expect(screen.getByText(/score 7\.5/)).toBeInTheDocument();
  });

  it('expands consultant details with accordion — only one open at a time', async () => {
    const user = userEvent.setup();
    render(
      <MemoryRouter>
        <RequestMatchPanel requestId={1} />
      </MemoryRouter>,
    );
    await waitFor(() => screen.getByRole('button', { name: /^Kjør AI-matching$/i }));
    await user.click(screen.getByRole('button', { name: /^Kjør AI-matching$/i }));
    expect(await screen.findByText(/Thomas Andersen/)).toBeInTheDocument();

    const expandThomas = screen.getByRole('button', { name: /Vis detaljer for Thomas Andersen/i });
    const expandStine = screen.getByRole('button', { name: /Vis detaljer for Stine Holst/i });

    await user.click(expandThomas);
    expect(expandThomas).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByText(/God match med lang begrunnelse/)).toBeVisible();

    await user.click(expandStine);
    expect(expandStine).toHaveAttribute('aria-expanded', 'true');
    expect(expandThomas).toHaveAttribute('aria-expanded', 'false');
    expect(screen.getByText(/Sterk profil med relevant erfaring/)).toBeVisible();
  });
});
