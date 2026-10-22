import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within, act } from '@testing-library/react';
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
    { name: 'Kotlin', priority: 'MUST', skills: ['KOTLIN'], consultants: 16, projectOnly: 0 },
    { name: 'Kafka', priority: 'MUST', skills: ['KAFKA'], consultants: 10, projectOnly: 0 },
  ],
  otherRequirements: ['Minimum 8 års relevant arbeidserfaring'],
};

const renderPanel = (props: Partial<React.ComponentProps<typeof RequestMatchPanel>> = {}) =>
  render(
    <MemoryRouter>
      <RequestMatchPanel requestId={1} coverage={coverage} {...props} />
    </MemoryRouter>,
  );

const defaultPreview = {
  projectRequestId: 1,
  semanticSearchReady: true,
  candidates: [
    { userId: 'u1', name: 'Kari', combinedScore: 0.8, reason: 'God overlap', mustCovered: 2, mustTotal: 2, matchedRequirements: ['Kotlin', 'Kafka'], missingRequirements: [] },
    { userId: 'u2', name: 'Ola', combinedScore: 0.72, reason: 'Delvis overlap', mustCovered: 1, mustTotal: 2, matchedRequirements: ['Kotlin'], missingRequirements: ['Kafka'] },
    { userId: 'u3', name: 'Nina', combinedScore: 0.69, reason: 'Svak overlap', mustCovered: 1, mustTotal: 2, matchedRequirements: ['Kafka'], missingRequirements: ['Kotlin'] },
  ],
};

const defaultRun = {
  projectRequestId: 1,
  matches: [
    { userId: 'u1', name: 'Thomas Andersen', cvId: 'c1', score: 8.3, scorePercent: 83, justification: 'God match med lang begrunnelse som skal vises når raden utvides.' },
    { userId: 'u2', name: 'Stine Holst', cvId: 'c2', score: 7.5, scorePercent: 75, justification: 'Sterk profil med relevant erfaring.' },
  ],
  lastUpdated: '2026-01-01T12:00:00Z',
};

vi.mock('../../api/matchingApi', () => ({
  getProjectMatchStatus: vi.fn(),
  getProjectMatchResults: vi.fn(),
  previewProjectMatches: vi.fn(),
  runProjectMatching: vi.fn(),
}));

vi.mock('../../services/consultantsService', () => ({
  getEmbeddingInfo: vi.fn(),
}));

/**
 * The panel in the order the work happens: the requirements, the candidates, the AI. The preview
 * is free and loads by itself; the AI run is the one paid step and waits for a click; the settings
 * sit behind a button.
 */
/** A promise the test resolves when it decides, to put answers in the order the network might. */
function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => { resolve = res; reject = rej; });
  return { promise, resolve, reject };
}

const storedRun = {
  projectRequestId: 1,
  matches: [{ userId: 'u1', name: 'Thomas Andersen', cvId: 'c1', score: 8.3, scorePercent: 83, justification: 'Lagret.' }],
  lastUpdated: '2026-01-01T12:00:00Z',
};

describe('RequestMatchPanel', () => {
  // Reset, then the defaults again: clearAllMocks keeps a test's mockReturnValue, and a deferred
  // preview from one test hung the next twelve.
  beforeEach(async () => {
    vi.resetAllMocks();
    const api = await import('../../api/matchingApi');
    vi.mocked(api.getProjectMatchStatus).mockResolvedValue({ projectRequestId: 1, status: 'NOT_STARTED' } as never);
    vi.mocked(api.getProjectMatchResults).mockResolvedValue(null as never);
    vi.mocked(api.previewProjectMatches).mockResolvedValue(defaultPreview as never);
    vi.mocked(api.runProjectMatching).mockResolvedValue(defaultRun as never);
    const consultants = await import('../../services/consultantsService');
    vi.mocked(consultants.getEmbeddingInfo).mockResolvedValue({ enabled: true, semanticSearchReady: false } as never);
  });

  /**
   * The four states are separate. The preview is an estimate of whom to assess and says nothing
   * about whether an assessment was run; it used to write «Forhåndsvisning klar» over a completed
   * run whenever its answer came last.
   */
  it('never lets the preview overwrite the status of a completed run', async () => {
    const api = await import('../../api/matchingApi');
    const preview = deferred<unknown>();
    vi.mocked(api.getProjectMatchStatus).mockResolvedValue({ projectRequestId: 1, status: 'COMPLETED' } as never);
    vi.mocked(api.getProjectMatchResults).mockResolvedValue(storedRun as never);
    vi.mocked(api.previewProjectMatches).mockReturnValue(preview.promise as never);
    renderPanel();

    expect(await screen.findByText('Fullført')).toBeInTheDocument();
    await act(async () => {
      preview.resolve({ projectRequestId: 1, semanticSearchReady: true, candidates: [{ userId: 'u1', name: 'Kari', combinedScore: 0.8 }] });
    });

    expect(await screen.findByText('Kari')).toBeInTheDocument();
    expect(screen.getByText('Fullført')).toBeInTheDocument();
    expect(screen.queryByText('Forhåndsvisning klar')).not.toBeInTheDocument();
  });

  /**
   * A server error is not «not run». It used to fall back to NOT_STARTED and null, so a 500 read
   * as «nothing has been run» and invited a paid run of what was already stored.
   */
  it('says when the stored assessment could not be read, and never calls it «ikke kjørt»', async () => {
    const api = await import('../../api/matchingApi');
    vi.mocked(api.getProjectMatchStatus).mockRejectedValue(new Error('Request failed with status code 500'));
    vi.mocked(api.getProjectMatchResults).mockRejectedValue(new Error('Request failed with status code 500'));
    renderPanel();

    expect(await screen.findByText(/Kunne ikke hente vurderingen/)).toBeInTheDocument();
    expect(screen.getByText('Status ukjent')).toBeInTheDocument();
    expect(screen.queryByText('Ikke kjørt')).not.toBeInTheDocument();

    // Retrying reads again and runs nothing.
    vi.mocked(api.getProjectMatchStatus).mockResolvedValue({ projectRequestId: 1, status: 'COMPLETED' } as never);
    vi.mocked(api.getProjectMatchResults).mockResolvedValue(storedRun as never);
    await userEvent.click(screen.getByRole('button', { name: 'Hent på nytt' }));

    expect(await screen.findByText('Fullført')).toBeInTheDocument();
    expect(screen.queryByText(/Kunne ikke hente vurderingen/)).not.toBeInTheDocument();
    expect(api.runProjectMatching).not.toHaveBeenCalled();
  });

  /** A slow answer for the avrop the panel left is dropped, not shown under the next one. */
  it('ignores an answer that arrives for a request the panel has moved on from', async () => {
    const api = await import('../../api/matchingApi');
    const firstResults = deferred<unknown>();
    vi.mocked(api.getProjectMatchStatus).mockResolvedValue({ projectRequestId: 1, status: 'NOT_STARTED' } as never);
    vi.mocked(api.getProjectMatchResults).mockImplementation((id: number) =>
      (id === 1 ? firstResults.promise : Promise.resolve(null)) as never);
    const view = renderPanel({ requestId: 1 });

    view.rerender(
      <MemoryRouter>
        <RequestMatchPanel requestId={2} coverage={coverage} />
      </MemoryRouter>,
    );
    await screen.findByText('Kari');
    await act(async () => { firstResults.resolve(storedRun); });

    expect(screen.queryByText('Thomas Andersen')).not.toBeInTheDocument();
    expect(screen.queryByText('Fullført')).not.toBeInTheDocument();
  });

  it('loads the free preview by itself, and never runs the AI by itself', async () => {
    const api = await import('../../api/matchingApi');
    renderPanel();
    await waitFor(() => expect(api.previewProjectMatches).toHaveBeenCalledWith(1, { limit: 20 }));
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
    expect(screen.getByText(/treff på 2 av 2 må-krav/)).toBeInTheDocument();
    expect(screen.getAllByText(/treff på 1 av 2 må-krav/)).toHaveLength(2);
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
    expect(screen.getByText('Hvor mange vurderes')).toBeInTheDocument();
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

  /**
   * After a run the candidate list was cleared: «Kandidater» stood empty under a card that said six
   * people covered every must, with no way back to the list short of closing the card.
   */
  it('keeps the candidates on the page after an AI run', async () => {
    const api = await import('../../api/matchingApi');
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText(/3 av 3 valgt/);
    await user.click(screen.getByRole('button', { name: /^Kjør AI-matching \(3\)$/i }));
    await waitFor(() => expect(api.runProjectMatching).toHaveBeenCalled());
    expect(await screen.findByText(/score 8\.3/)).toBeInTheDocument();

    expect(screen.getByText(/3 av 3 valgt/)).toBeInTheDocument();
    expect(screen.getByText('Kari')).toBeInTheDocument();
    expect(screen.getByText('Nina')).toBeInTheDocument();
  });

  /** Decided 2026-10-20: 20 percent by default, and the choices are 0, 10, 20 and 30. */
  it('sends the default CV-quality weight of 20 and offers 0, 10, 20 and 30', async () => {
    const api = await import('../../api/matchingApi');
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText(/3 av 3 valgt/);
    await user.click(screen.getByRole('button', { name: /^Kjør AI-matching \(3\)$/i }));
    await waitFor(() => expect(api.runProjectMatching).toHaveBeenCalled());

    expect(vi.mocked(api.runProjectMatching).mock.calls[0][1]).toMatchObject({ cvWeightPercent: 20 });
    await user.click(screen.getByRole('button', { name: /innstillinger/i }));
    expect(['0%', '10%', '20%', '30%'].map((w) => screen.getByRole('button', { name: w }))).toHaveLength(4);
  });

  /**
   * The order is the backend's, the match weighed against CV quality, and when quality moved
   * somebody the row says so with a link to the CV score, so a leader sees whose CV to work on.
   */
  it('keeps the backend order and says when CV quality moved somebody', async () => {
    const api = await import('../../api/matchingApi');
    vi.mocked(api.runProjectMatching).mockResolvedValueOnce({
      projectRequestId: 1,
      matches: [
        { userId: 'u1', name: 'Thomas Andersen Sopra', cvId: 'c1', score: 7.1, scorePercent: 71, presentedScore: 7.6, presentedScorePercent: 76, cvQualityScore: 88, rankByMatch: 2,
          qualityNote: 'Ligger over Joachim Lous fordi CV-scoren er 88 mot 66. Kravmatchen er 7,1 mot 8,3.', passedOnQuality: false, justification: 'Solid.' },
        { userId: 'u2', name: 'Joachim Lous', cvId: 'c2', score: 8.3, scorePercent: 83, presentedScore: 7.4, presentedScorePercent: 74, cvQualityScore: 66, rankByMatch: 1,
          qualityNote: 'Ligger under Thomas Andersen Sopra fordi CV-scoren er 66 mot 88. Kravmatchen er 8,3 mot 7,1.', passedOnQuality: true, justification: 'Sterk.' },
      ],
      lastUpdated: '2026-10-20T12:00:00Z',
    } as never);
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText(/3 av 3 valgt/);
    await user.click(screen.getByRole('button', { name: /^Kjør AI-matching \(3\)$/i }));
    await screen.findByText('2 AI-vurdert');

    const names = screen.getAllByText(/Thomas Andersen Sopra|Joachim Lous/, { selector: 'b' }).map((el) => el.textContent);
    expect(names).toEqual(['Thomas Andersen Sopra', 'Joachim Lous']);
    expect(screen.getByText(/CV 66 → 7,4/)).toBeInTheDocument();
    expect(screen.getByText('Passert på CV-score')).toBeInTheDocument();
    expect(screen.getByText(/Ligger under Thomas Andersen Sopra fordi CV-scoren er 66 mot 88/)).toBeInTheDocument();
    const links = screen.getAllByRole('link', { name: 'Se CV-score' });
    expect(links.map((l) => l.getAttribute('href'))).toEqual(['/cv-score/u1', '/cv-score/u2']);
  });

  /**
   * The preselection's order predicts the model's poorly (the model's second on 9011 was its
   * fifteenth), so twenty go to the model by default, all ticked, while the list shows five
   * until asked.
   */
  it('asks for twenty, ticks them all, and shows five until asked', async () => {
    const api = await import('../../api/matchingApi');
    const eight = Array.from({ length: 8 }, (_, i) => ({
      userId: `p${i + 1}`, name: `Person ${i + 1}`, combinedScore: 0.9 - i * 0.05, reason: '', mustCovered: 1, mustTotal: 2, matchedRequirements: ['Kotlin'], missingRequirements: ['Kafka'],
    }));
    vi.mocked(api.previewProjectMatches).mockResolvedValueOnce({ projectRequestId: 1, semanticSearchReady: true, candidates: eight } as never);
    const user = userEvent.setup();
    renderPanel();

    expect(await screen.findByText(/8 av 8 valgt/)).toBeInTheDocument();
    expect(vi.mocked(api.previewProjectMatches).mock.calls[0][1]).toMatchObject({ limit: 20 });
    expect(screen.getByText('Person 5')).toBeInTheDocument();
    expect(screen.queryByText('Person 6')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Vis alle 8' }));
    expect(screen.getByText('Person 8')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /^Kjør AI-matching \(8\)$/i }));
    await waitFor(() => expect(api.runProjectMatching).toHaveBeenCalled());
    expect(vi.mocked(api.runProjectMatching).mock.calls[0][1]).toMatchObject({ consultantUserIds: eight.map((p) => p.userId) });
  });

  /** On its own page the assessment is the answer: it comes first, and the requirements are in the header. */
  it('in page layout puts the AI assessment before the candidates and leaves the requirements out', async () => {
    renderPanel({ layout: 'page' });
    await screen.findByText(/3 av 3 valgt/);

    expect(screen.queryByRole('link', { name: 'Se hele avropet' })).not.toBeInTheDocument();
    const ai = screen.getByRole('heading', { name: 'AI-vurdering' });
    const candidates = screen.getByRole('heading', { name: 'Kandidater' });
    expect(ai.compareDocumentPosition(candidates) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  /** The total alone says nothing about which requirement is weak; the row opens on the scores behind it. */
  it('shows the score per requirement when an AI row is opened, must-haves first', async () => {
    const api = await import('../../api/matchingApi');
    vi.mocked(api.runProjectMatching).mockResolvedValueOnce({
      projectRequestId: 1,
      matches: [{
        userId: 'u1', name: 'Thomas Andersen Sopra', cvId: 'c1', score: 7.4, scorePercent: 74, justification: 'Solid.',
        requirements: [{ name: 'ID-porten', isMustHave: false, score: 2.0 }, { name: 'Kafka', isMustHave: true, score: 1.0 }, { name: 'Kotlin', isMustHave: true, score: 9.0 }],
      }],
      lastUpdated: '2026-10-21T12:00:00Z',
    } as never);
    const user = userEvent.setup();
    renderPanel();
    await screen.findByText(/3 av 3 valgt/);
    await user.click(screen.getByRole('button', { name: /^Kjør AI-matching \(3\)$/i }));
    await screen.findByText('1 AI-vurdert');

    await user.click(screen.getByRole('button', { name: 'Vis detaljer for Thomas Andersen Sopra' }));

    const chips = within(screen.getByLabelText('Skår per krav')).getAllByText(/\d\.\d$/).map((el) => el.textContent);
    expect(chips).toEqual(['Kafka 1.0', 'Kotlin 9.0', 'ID-porten 2.0']);
  });

  it('says by name who covers every must', async () => {
    renderPanel({ coverage: { ...coverage, fullMatchNames: ['Kari'] } });

    expect(await screen.findByText('Treff på alle må-krav: Kari')).toBeInTheDocument();
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

  /**
   * The run's own counters, from the status endpoint: a run where seventeen of twenty answered
   * is «Delvis fullført, 17 av 20 vurdert, 3 feilet», not «Fullført». A running one says how far.
   */
  it('shows how a run went, and how far a running one has come', async () => {
    const api = await import('../../api/matchingApi');
    vi.mocked(api.getProjectMatchStatus).mockResolvedValue({
      projectRequestId: 1, status: 'PARTIAL', runId: 21, attempted: 20, done: 20, succeeded: 17, failed: 3, skipped: 0,
    } as never);
    vi.mocked(api.getProjectMatchResults).mockResolvedValue(storedRun as never);
    renderPanel();

    expect(await screen.findByText('Delvis fullført')).toBeInTheDocument();
    expect(screen.getByText('17 av 20 vurdert, 3 feilet')).toBeInTheDocument();

    vi.mocked(api.getProjectMatchStatus).mockResolvedValue({
      projectRequestId: 1, status: 'RUNNING', runId: 22, attempted: 20, done: 7, succeeded: 6, failed: 1, skipped: 0,
    } as never);
    await userEvent.click(screen.getByRole('button', { name: 'Oppdater status' }));

    expect(await screen.findByText('7 av 20 ferdige')).toBeInTheDocument();
    expect(screen.getByText('Kjører AI-matching…')).toBeInTheDocument();
  });
});
