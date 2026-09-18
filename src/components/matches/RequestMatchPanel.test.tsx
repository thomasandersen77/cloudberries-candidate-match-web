import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import RequestMatchPanel from './RequestMatchPanel';
import type { RequirementCoverage } from './coverageText';

const coverage: RequirementCoverage = {
  technologyRequirements: 2,
  covered: 2,
  fullMatchCount: 1,
  fullMatchBasis: 'MUST',
  requirements: [
    { name: 'Kotlin', priority: 'MUST', skills: ['KOTLIN'], consultants: 16 },
    { name: 'Kafka', priority: 'MUST', skills: ['KAFKA'], consultants: 10 },
  ],
  otherRequirements: ['Minimum 8 års relevant arbeidserfaring'],
};

const renderPanel = (props: Partial<React.ComponentProps<typeof RequestMatchPanel>> = {}) =>
  render(
    <MemoryRouter>
      <RequestMatchPanel requestId={1} coverage={coverage} {...props} />
    </MemoryRouter>,
  );

vi.mock('../../api/matchingApi', () => ({
  getProjectMatchStatus: vi.fn().mockResolvedValue({ projectRequestId: 1, status: 'NOT_STARTED' }),
  getProjectMatchResults: vi.fn().mockResolvedValue(null),
  previewProjectMatches: vi.fn().mockResolvedValue({
    projectRequestId: 1,
    semanticSearchReady: true,
    candidates: [
      { userId: 'u1', name: 'Kari', combinedScore: 0.8, reason: 'God overlap', mustCovered: 2, mustTotal: 2, matchedRequirements: ['Kotlin', 'Kafka'], missingRequirements: [] },
      { userId: 'u2', name: 'Ola', combinedScore: 0.72, reason: 'Delvis overlap', mustCovered: 1, mustTotal: 2, matchedRequirements: ['Kotlin'], missingRequirements: ['Kafka'] },
      { userId: 'u3', name: 'Nina', combinedScore: 0.69, reason: 'Svak overlap', mustCovered: 1, mustTotal: 2, matchedRequirements: ['Kafka'], missingRequirements: ['Kotlin'] },
    ],
  }),
  runProjectMatching: vi.fn().mockResolvedValue({
    projectRequestId: 1,
    matches: [
      { userId: 'u1', name: 'Thomas Andersen', cvId: 'c1', score: 8.3, scorePercent: 83, justification: 'God match med lang begrunnelse som skal vises når raden utvides.' },
      { userId: 'u2', name: 'Stine Holst', cvId: 'c2', score: 7.5, scorePercent: 75, justification: 'Sterk profil med relevant erfaring.' },
    ],
    lastUpdated: '2026-01-01T12:00:00Z',
  }),
}));

vi.mock('../../services/consultantsService', () => ({
  getEmbeddingInfo: vi.fn().mockResolvedValue({ enabled: true, semanticSearchReady: false }),
}));

/**
 * The panel in the order the work happens: the requirements, the candidates, the AI. The preview
 * is free and loads by itself; the AI run is the one paid step and waits for a click; the settings
 * sit behind a button.
 */
describe('RequestMatchPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('loads the free preview by itself, and never runs the AI by itself', async () => {
    const api = await import('../../api/matchingApi');
    renderPanel();
    await waitFor(() => expect(api.previewProjectMatches).toHaveBeenCalledWith(1, { limit: 10 }));
    expect(api.getProjectMatchStatus).toHaveBeenCalled();
    expect(api.runProjectMatching).not.toHaveBeenCalled();
  });

  it('shows the requirements first, with their counts and the ones that cannot be checked', async () => {
    renderPanel();
    expect(await screen.findByText('Kotlin 16')).toBeInTheDocument();
    expect(screen.getByText('Kafka 10')).toBeInTheDocument();
    expect(screen.getByText(/Sjekkes ikke mot ferdigheter: Minimum 8 års relevant arbeidserfaring/)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Se hele avropet' })).toHaveAttribute('href', '/project-requests/1');
  });

  it('says per candidate which musts they cover and which they lack', async () => {
    renderPanel();
    await screen.findByText(/3 av 3 valgt/);
    expect(screen.getByText(/dekker 2 av 2 må-krav/)).toBeInTheDocument();
    expect(screen.getAllByText(/dekker 1 av 2 må-krav/)).toHaveLength(2);
    expect(screen.getByText(/Mangler: Kafka/)).toBeInTheDocument();
    expect(screen.getByText(/Mangler: Kotlin/)).toBeInTheDocument();
  });

  it('keeps the settings behind a button, with highest quality off by default', async () => {
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText(/3 av 3 valgt/);
    expect(screen.queryByRole('checkbox', { name: /Bruk høyeste kvalitet/i })).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Innstillinger' }));

    expect(screen.getByRole('checkbox', { name: /Bruk høyeste kvalitet/i })).not.toBeChecked();
    expect(screen.getByText('Antall kandidater')).toBeInTheDocument();
  });

  it('sends only the ticked candidates to the AI', async () => {
    // Preselection ranks for recall, and its order predicts the LLM's poorly, so who goes to the
    // model is the operator's call rather than the score's.
    const api = await import('../../api/matchingApi');
    const user = userEvent.setup();
    renderPanel();
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
    vi.mocked(api.previewProjectMatches).mockResolvedValueOnce(null);
    const user = userEvent.setup();
    renderPanel();
    await waitFor(() => expect(api.previewProjectMatches).toHaveBeenCalled());
    await waitFor(() => expect(screen.getByRole('button', { name: /^Kjør AI-matching$/i })).toBeEnabled());

    await user.click(screen.getByRole('button', { name: /^Kjør AI-matching$/i }));

    await waitFor(() => expect(api.runProjectMatching).toHaveBeenCalled());
    expect(vi.mocked(api.runProjectMatching).mock.calls[0][1]).toMatchObject({
      consultantUserIds: [],
    });
  });

  it('shows confirmation when running with highest quality', async () => {
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText(/3 av 3 valgt/);
    await user.click(screen.getByRole('button', { name: 'Innstillinger' }));
    await user.click(screen.getByRole('checkbox', { name: /Bruk høyeste kvalitet/i }));
    await user.click(screen.getByRole('button', { name: /^Kjør AI-matching \(3\)$/i }));
    expect(await screen.findByText(/Dette kan bruke betydelig mer AI-kreditt/i)).toBeInTheDocument();
  });

  it('renders decimal AI match scores without integer truncation', async () => {
    const api = await import('../../api/matchingApi');
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText(/3 av 3 valgt/);
    await user.click(screen.getByRole('button', { name: /^Kjør AI-matching \(3\)$/i }));
    await waitFor(() => expect(api.runProjectMatching).toHaveBeenCalled());
    expect(await screen.findByText(/Thomas Andersen/)).toBeInTheDocument();
    expect(screen.getByText(/score 8\.3/)).toBeInTheDocument();
    expect(screen.getByText(/score 7\.5/)).toBeInTheDocument();
    expect(screen.getByText('2 AI-vurdert')).toBeInTheDocument();
  });

  it('expands consultant details with accordion — only one open at a time', async () => {
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText(/3 av 3 valgt/);
    await user.click(screen.getByRole('button', { name: /^Kjør AI-matching \(3\)$/i }));
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
