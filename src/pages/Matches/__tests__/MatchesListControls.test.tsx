import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
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
const renderList = () => {
  mockedList.mockResolvedValue({ content: [], currentPage: 0, totalPages: 0, totalElements: 0, pageSize: 20, hasNext: false, hasPrevious: false } as never);
  return render(
    <MemoryRouter initialEntries={['/matches']}>
      <Routes><Route path="/matches" element={<MatchesPage />} /></Routes>
    </MemoryRouter>
  );
};

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
    fireEvent.click(within(screen.getByRole('listbox')).getByText('Høy dekning først'));

    await waitFor(() => expect(lastQuery()).toMatchObject({ page: 0, sort: 'coverage,desc' }));
    expect(screen.getByRole('combobox', { name: /Sortering/ })).toHaveTextContent('Høy dekning først');
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

    fireEvent.click(screen.getByRole('button', { name: 'Høy dekning' }));
    fireEvent.click(screen.getByRole('button', { name: 'Lav dekning' }));
    await waitFor(() => expect(lastQuery()).toMatchObject({ coverage: ['GREEN', 'RED'] }));

    fireEvent.click(screen.getByRole('button', { name: 'Høy dekning' }));
    await waitFor(() => expect(lastQuery()).toMatchObject({ coverage: ['RED'] }));

    fireEvent.click(screen.getByRole('button', { name: 'Nullstill' }));
    await waitFor(() => expect(lastQuery()).toMatchObject({ assessed: null, coverage: [] }));
    expect(screen.queryByRole('button', { name: 'Nullstill' })).not.toBeInTheDocument();
  });
});
