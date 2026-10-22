import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MatchesPage from '../MatchesPage';
import { listMatchRequests } from '../../../services/matchesRequestsService';

vi.mock('../../../services/matchesRequestsService', () => ({
  listMatchRequests: vi.fn(),
  getMatchRequest: vi.fn(),
}));
// The panel has its own tests and its own API; here the card is the subject.
vi.mock('../../../components/matches/RequestMatchPanel', () => ({
  default: () => <div data-testid="panel">panel</div>,
}));
const mockedList = vi.mocked(listMatchRequests);

/**
 * What a request card says about how well the corpus covers the request.
 *
 * The status and its words come from the server: how many consultants hold a skill for every must,
 * green from three. Under it the requirements themselves, with the number of people holding each,
 * so the red one is the bottleneck a reader is looking for. The card used to say "God søkedekning"
 * over a count of people who knew at least one of the technologies, which was green for 26 of 27
 * requests and told nobody anything.
 */
const coverage = {
  technologyRequirements: 3,
  covered: 2,
  fullMatchCount: 0,
  fullMatchBasis: 'MUST',
  requirements: [
    { name: 'Kotlin', priority: 'MUST', skills: ['KOTLIN'], consultants: 16, projectOnly: 0 },
    { name: 'Flink', priority: 'MUST', skills: ['FLINK'], consultants: 0, projectOnly: 0 },
    { name: 'Terraform', priority: 'SHOULD', skills: ['TERRAFORM'], consultants: 11, projectOnly: 0 },
  ],
  otherRequirements: ['Minimum 8 års relevant arbeidserfaring'],
};

const row = (over: Record<string, unknown>) => ({
  id: 1,
  title: 'Konsulentoppdrag: modernisering av fagsystem',
  role: 'Senior backend-utvikler',
  customerName: 'Statens vegvesen',
  date: '2026-01-01T10:00:00Z',
  deadlineDate: '2026-01-20T10:00:00Z',
  coverageStatus: 'RED',
  coverageLabel: 'Ingen har treff på alle må-krav',
  coverage,
  aiMatchCount: null,
  aiLastUpdated: null,
  ...over,
});

const renderWith = (over: Record<string, unknown>) => {
  mockedList.mockResolvedValue({
    content: [row(over)],
    currentPage: 0,
    totalPages: 1,
    pageSize: 20,
    hasNext: false,
    hasPrevious: false,
  } as never);
  return render(
    <MemoryRouter initialEntries={['/matches']}>
      <Routes>
        <Route path="/matches" element={<MatchesPage />} />
        <Route path="/matches/:id" element={<div data-testid="request-page" />} />
      </Routes>
    </MemoryRouter>
  );
};

describe('dekning på et forespørselskort', () => {
  beforeEach(() => vi.clearAllMocks());

  /** The words are the server's; the page paints them and adds nothing. */
  it.each([
    ['GREEN', '4 har treff på alle må-krav'],
    ['YELLOW', '1 har treff på alle må-krav'],
    ['RED', 'Ingen har treff på alle må-krav'],
    ['NEUTRAL', 'Ingen teknologikrav gjenkjent'],
  ])('gjengir serverens etikett for %s', async (coverageStatus, coverageLabel) => {
    renderWith({ coverageStatus, coverageLabel });

    expect(await screen.findByText(coverageLabel)).toBeInTheDocument();
    expect(screen.queryByText(/søketreff/)).not.toBeInTheDocument();
  });

  it('viser må-kravene med antall, det ingen har i rødt, og teller bør-kravene', async () => {
    renderWith({});

    expect(await screen.findByText('Kotlin 16')).toBeInTheDocument();
    expect(screen.getByText('Flink 0').closest('.MuiChip-root')?.className).toMatch(/MuiChip-colorError/);
    expect(screen.queryByText('Terraform 11')).not.toBeInTheDocument();
    expect(screen.getByText('+ 1 bør-krav')).toBeInTheDocument();
    expect(screen.getByText('Treff på 2 av 3 teknologikrav · 1 krav må vurderes manuelt')).toBeInTheDocument();
  });

  /** The card said how many; finding the one person meant opening it. Now it says who, closed. */
  it('sier hvem som har treff på alle må-krav uten at kortet åpnes, og hvor mange til', async () => {
    renderWith({
      coverageStatus: 'GREEN',
      coverageLabel: '6 har treff på alle må-krav',
      coverage: { ...coverage, fullMatchCount: 6, fullMatchNames: ['Ayhan Ileri', 'Geir Normann Hansen', 'Joachim Lous', 'Shervin Asgari', 'Thomas Andersen', 'Thomas Andersen Sopra'] },
    });

    expect(await screen.findByText('Treff på alle må-krav: Ayhan Ileri, Geir Normann Hansen, Joachim Lous, Shervin Asgari og 2 til')).toBeInTheDocument();
  });

  it('sier ingenting om navn når ingen har treff på alle må-krav', async () => {
    renderWith({});

    await screen.findByText('Kotlin 16');
    expect(screen.queryByText(/Treff på alle må-krav:/)).not.toBeInTheDocument();
  });

  it('sier om AI-en har vurdert noen, med dato, og ellers at den ikke har', async () => {
    renderWith({ aiMatchCount: 3, aiLastUpdated: '2026-09-10T21:42:22+02:00' });
    expect(await screen.findByText(/^3 AI-vurdert /)).toBeInTheDocument();
  });

  it('har én handling: åpne, som går til avropets egen side', async () => {
    renderWith({});
    await screen.findByText('Kotlin 16');
    expect(screen.queryByText('Åpne forespørselen')).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Utvid' })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Åpne' }));

    expect(await screen.findByTestId('request-page')).toBeInTheDocument();
  });

  /** Customer first, role next, document heading after: what you scan a list for. */
  it('setter kunde og rolle foran dokumenttittelen, og frist på kortet', async () => {
    renderWith({});

    const customer = await screen.findByText('Statens vegvesen');
    const role = screen.getByText('Senior backend-utvikler');
    const title = screen.getByText('Konsulentoppdrag: modernisering av fagsystem');

    expect(customer.compareDocumentPosition(role) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(role.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByText(/^Frist \d{1,2}\.\d{1,2}\.2026 · lastet opp/)).toBeInTheDocument();
  });

  /** A heading that runs long is clamped, and the whole of it stays reachable. */
  it('klipper en lang dokumenttittel, men beholder hele teksten', async () => {
    const long = 'Tilbudsinnbydelse minikonkurranse under rammeavtale for kjøp av konsulenttjenester '
      + 'innen systemutvikling, arkitektur og forvaltning for perioden 2026 til 2029';
    renderWith({ title: long });

    const title = await screen.findByText(long);
    expect(title).toHaveAttribute('title', long);
    expect(title).toHaveStyle({ overflow: 'hidden' });
  });

  /** The qualifier sits on the page, not in the help that can be switched off. */
  it('forklarer hva tallene er, utenfor sidehjelpen', async () => {
    renderWith({});

    expect(await screen.findByText(/har den ferdigheten på CV-en/)).toBeInTheDocument();
    expect(screen.getByText(/hvem som finnes, ikke hvem som passer/)).toBeInTheDocument();
  });
});
