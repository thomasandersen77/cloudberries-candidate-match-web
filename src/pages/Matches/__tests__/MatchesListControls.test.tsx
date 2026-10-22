import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import MatchesPage from '../MatchesPage';
import { listMatchRequests } from '../../../services/matchesRequestsService';

vi.mock('../../../services/matchesRequestsService', () => ({
  listMatchRequests: vi.fn(),
  getMatchRequest: vi.fn(),
}));
const mockedList = vi.mocked(listMatchRequests);

/**
 * The order and the filters on the list: what the chips and the select send the server.
 *
 * Sorting on the AI and on coverage is the server's, over values it computes; the page only
 * sends the query and starts again from the first page when it changes.
 */
/** What the list's URL says now, from inside the router. */
const Location: React.FC = () => {
  const location = useLocation();
  return <div data-testid="location">{location.pathname + location.search}</div>;
};

const renderList = (at = '/matches') => {
  mockedList.mockResolvedValue({ content: [], currentPage: 0, totalPages: 0, totalElements: 0, pageSize: 20, hasNext: false, hasPrevious: false } as never);
  return render(
    <MemoryRouter initialEntries={[at]}>
      <Routes><Route path="/matches" element={<><MatchesPage /><Location /></>} /></Routes>
    </MemoryRouter>
  );
};

const locationNow = () => screen.getByTestId('location').textContent;

const lastQuery = () => mockedList.mock.calls[mockedList.mock.calls.length - 1][0];

describe('sortering og filtre på matchlisten', () => {
  beforeEach(() => vi.clearAllMocks());

  it('starter nyeste først uten filtre', async () => {
    renderList();
    await waitFor(() => expect(mockedList).toHaveBeenCalled());
    expect(lastQuery()).toMatchObject({ page: 0, size: 20, sort: 'date,desc', assessed: null, coverage: [] });
  });

  it('sender valgt sortering, fra første side', async () => {
    renderList();
    await waitFor(() => expect(mockedList).toHaveBeenCalled());

    fireEvent.mouseDown(screen.getByRole('combobox', { name: /Sortering/ }));
    fireEvent.click(within(screen.getByRole('listbox')).getByText('Flest treff først'));

    await waitFor(() => expect(lastQuery()).toMatchObject({ page: 0, sort: 'coverage,desc' }));
    expect(screen.getByRole('combobox', { name: /Sortering/ })).toHaveTextContent('Flest treff først');
  });

  /** One of two states or none: the two AI chips exclude each other, and a second click clears. */
  it('filtrerer på AI-vurdering med to chips som utelukker hverandre', async () => {
    renderList();
    await waitFor(() => expect(mockedList).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'Ikke AI-vurdert' }));
    await waitFor(() => expect(lastQuery()).toMatchObject({ assessed: false }));
    expect(screen.getByRole('button', { name: 'Ikke AI-vurdert' })).toHaveAttribute('aria-pressed', 'true');

    fireEvent.click(screen.getByRole('button', { name: 'AI-vurdert' }));
    await waitFor(() => expect(lastQuery()).toMatchObject({ assessed: true }));
    expect(screen.getByRole('button', { name: 'Ikke AI-vurdert' })).toHaveAttribute('aria-pressed', 'false');

    fireEvent.click(screen.getByRole('button', { name: 'AI-vurdert' }));
    await waitFor(() => expect(lastQuery()).toMatchObject({ assessed: null }));
  });

  it('legger dekningsfiltre sammen, og nullstiller alle på én knapp', async () => {
    renderList();
    await waitFor(() => expect(mockedList).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'Mange treff' }));
    fireEvent.click(screen.getByRole('button', { name: 'Få treff' }));
    await waitFor(() => expect(lastQuery()).toMatchObject({ coverage: ['GREEN', 'RED'] }));

    fireEvent.click(screen.getByRole('button', { name: 'Mange treff' }));
    await waitFor(() => expect(lastQuery()).toMatchObject({ coverage: ['RED'] }));

    fireEvent.click(screen.getByRole('button', { name: 'Nullstill' }));
    await waitFor(() => expect(lastQuery()).toMatchObject({ assessed: null, coverage: [] }));
    expect(screen.queryByRole('button', { name: 'Nullstill' })).not.toBeInTheDocument();
  });

  /**
   * The order, the filters and the page live in the URL. They were component state, so opening
   * a request and coming back reset them: «AI-vurdert» narrowed the list to seven, and «Tilbake
   * til matcher» showed twenty-seven.
   */
  it('keeps the order, the filters and the size in the URL, and leaves the defaults out of it', async () => {
    renderList();
    await waitFor(() => expect(mockedList).toHaveBeenCalled());
    expect(locationNow()).toBe('/matches');

    fireEvent.click(screen.getByRole('button', { name: 'Ikke AI-vurdert' }));
    fireEvent.click(screen.getByRole('button', { name: 'Mange treff' }));
    fireEvent.click(screen.getByRole('button', { name: '50' }));
    await waitFor(() => expect(lastQuery()).toMatchObject({ assessed: false, coverage: ['GREEN'], size: 50, page: 0 }));
    expect(locationNow()).toBe('/matches?assessed=false&coverage=GREEN&size=50');

    fireEvent.click(screen.getByRole('button', { name: 'Nullstill' }));
    await waitFor(() => expect(locationNow()).toBe('/matches?size=50'));
  });

  it('reads the order, the filters and the page back from the URL, and ignores what it does not know', async () => {
    renderList('/matches?sort=coverage,asc&assessed=true&coverage=RED,YELLOW,BOGUS&page=2&size=10&junk=1');
    await waitFor(() => expect(mockedList).toHaveBeenCalled());

    expect(lastQuery()).toMatchObject({ sort: 'coverage,asc', assessed: true, coverage: ['RED', 'YELLOW'], page: 2, size: 10 });
    expect(screen.getByRole('button', { name: 'AI-vurdert' })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('combobox', { name: /Sortering/ })).toHaveTextContent('Færrest treff først');
  });

  /** Plan C8: where the request is in the work, from its status and its deadline; the lights add up. */
  it('filtrerer på arbeidsstatus, og nullstiller den med resten', async () => {
    renderList();
    await waitFor(() => expect(mockedList).toHaveBeenCalled());

    fireEvent.click(screen.getByRole('button', { name: 'Frist passert' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lukket' }));

    await waitFor(() => expect(lastQuery()).toMatchObject({ page: 0, work: ['DEADLINE_PASSED', 'CLOSED'] }));
    expect(locationNow()).toContain('work=DEADLINE_PASSED%2CCLOSED');

    fireEvent.click(screen.getByRole('button', { name: 'Nullstill' }));
    await waitFor(() => expect(lastQuery()).toMatchObject({ work: [], coverage: [], assessed: null }));
  });

  it('leser arbeidsstatus fra adressen', async () => {
    renderList('/matches?work=ACTIVE,UKJENT');
    await waitFor(() => expect(mockedList).toHaveBeenCalled());
    expect(lastQuery()).toMatchObject({ work: ['ACTIVE'] });
  });
});

