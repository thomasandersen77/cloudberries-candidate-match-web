import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import MatchesPage from '../MatchesPage';
import { listMatchRequests } from '../../../services/matchesRequestsService';

vi.mock('../../../services/matchesRequestsService', () => ({
  listMatchRequests: vi.fn(),
  getTopConsultantsForRequest: vi.fn().mockResolvedValue([]),
}));
const mockedList = vi.mocked(listMatchRequests);

/**
 * What a request card says about its hit count.
 *
 * The number is consultants who know at least one of the request's technologies. It is a recall
 * number and nothing more: nobody has been assessed against the request when this is drawn. The
 * card used to be washed edge to edge in success.light and to label the number "Treff: 49", which
 * together read as "49 suitable candidates found, this one is handled".
 *
 * The status and its label come from the server. The page had a second definition with its own
 * thresholds — green at 10 where the server says 5 — and the two disagreed about the same row.
 * These cases pin that the page renders what it was given rather than recomputing it.
 */
const row = (over: Record<string, unknown>) => ({
  id: 1,
  title: 'Konsulentoppdrag: modernisering av fagsystem',
  role: 'Senior backend-utvikler',
  customerName: 'Statens vegvesen',
  date: '2026-01-01T10:00:00Z',
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
  return render(<MemoryRouter><MatchesPage /></MemoryRouter>);
};

describe('dekning på et forespørselskort', () => {
  beforeEach(() => vi.clearAllMocks());

  /** The thresholds, as the server applies them. 5 is green, 2 and 4 amber, 1 and 0 red. */
  it.each([
    [5, 'GREEN', 'God søkedekning'],
    [4, 'YELLOW', 'Begrenset søkedekning'],
    [2, 'YELLOW', 'Begrenset søkedekning'],
    [1, 'RED', 'Lav søkedekning'],
    [0, 'RED', 'Ingen treff'],
  ])('viser %i søketreff som «%s»', async (hitCount, coverageStatus, coverageLabel) => {
    renderWith({ hitCount, coverageStatus, coverageLabel });

    expect(await screen.findByText(coverageLabel)).toBeInTheDocument();
    expect(screen.getByText(`${hitCount} søketreff`)).toBeInTheDocument();
  });

  /**
   * Nothing to count is not a count of nothing. A request whose requirements name no technology
   * has never been searched for, and "0 søketreff" would be a claim nobody made.
   */
  it('skiller manglende kravgrunnlag fra null treff', async () => {
    renderWith({ hitCount: null, coverageStatus: 'NEUTRAL', coverageLabel: 'Ukjent dekning' });

    expect(await screen.findByText('Ukjent dekning')).toBeInTheDocument();
    expect(screen.getByText('Ingen ferdigheter å søke på')).toBeInTheDocument();
    expect(screen.queryByText('0 søketreff')).not.toBeInTheDocument();
  });

  /** The label is the server's word, not a second opinion computed from the count. */
  it('gjengir serverens etikett i stedet for å regne ut sin egen', async () => {
    renderWith({ hitCount: 12, coverageStatus: 'YELLOW', coverageLabel: 'Begrenset søkedekning' });

    expect(await screen.findByText('Begrenset søkedekning')).toBeInTheDocument();
    expect(screen.queryByText('God søkedekning')).not.toBeInTheDocument();
  });

  /** Customer first, role next, document heading after: what you scan a list for. */
  it('setter kunde og rolle foran dokumenttittelen', async () => {
    renderWith({ hitCount: 7, coverageStatus: 'GREEN', coverageLabel: 'God søkedekning' });

    const customer = await screen.findByText('Statens vegvesen');
    const role = screen.getByText('Senior backend-utvikler');
    const title = screen.getByText('Konsulentoppdrag: modernisering av fagsystem');

    expect(customer.compareDocumentPosition(role) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(role.compareDocumentPosition(title) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  /** A heading that runs long is clamped, and the whole of it stays reachable. */
  it('klipper en lang dokumenttittel, men beholder hele teksten', async () => {
    const long = 'Tilbudsinnbydelse minikonkurranse under rammeavtale for kjøp av konsulenttjenester '
      + 'innen systemutvikling, arkitektur og forvaltning for perioden 2026 til 2029';
    renderWith({ hitCount: 7, coverageStatus: 'GREEN', coverageLabel: 'God søkedekning', title: long });

    const title = await screen.findByText(long);
    expect(title).toHaveAttribute('title', long);
    expect(title).toHaveStyle({ overflow: 'hidden' });
  });

  /**
   * The qualifier sits on the page, not in the help that can be switched off: it explains what a
   * number on screen means.
   */
  it('forklarer hva et søketreff er, utenfor sidehjelpen', async () => {
    renderWith({ hitCount: 5, coverageStatus: 'GREEN', coverageLabel: 'God søkedekning' });

    expect(await screen.findByText(/minst én av teknologiene i forespørselen/)).toBeInTheDocument();
    expect(screen.getByText(/ikke at kravene er oppfylt/)).toBeInTheDocument();
  });
});
