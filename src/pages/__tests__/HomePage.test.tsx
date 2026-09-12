import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import HomePage from '../HomePage';
import { ColorModeProvider } from '../../theme';
import { listConsultantsWithCvPaged } from '../../services/consultantsService';
import { EVERYDAY_MODULES, SUPERUSER_MODULES } from '../modules';

vi.mock('../../services/consultantsService', () => ({
  listConsultantsWithCvPaged: vi.fn().mockResolvedValue({ content: [], totalElements: 118 })
}));
const mockedCount = vi.mocked(listConsultantsWithCvPaged);

/** The page reads the brand and the colour mode from the theme context, so it needs one. */
const renderPage = () => render(
  <ColorModeProvider>
    <MemoryRouter><HomePage /></MemoryRouter>
  </ColorModeProvider>
);

describe('HomePage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedCount.mockResolvedValue({ content: [], totalElements: 118 } as never);
  });

  /**
   * The figure said "111+" while the database held 118, and it said so for as long as it took
   * somebody to notice. A number written into a page is wrong the first time anybody syncs.
   */
  it('reads the number of consultants from the database', async () => {
    renderPage();

    expect(await screen.findByText('118')).toBeInTheDocument();
    expect(screen.queryByText(/111/)).not.toBeInTheDocument();
  });

  /** A dash rather than a guess, when the call does not come back. */
  it('shows no number rather than a stale one when the count cannot be read', async () => {
    mockedCount.mockRejectedValue(new Error('nede'));

    renderPage();

    expect(await screen.findByText('–')).toBeInTheDocument();
  });

  it('shows the everyday modules and not the superuser ones', async () => {
    renderPage();

    for (const module of EVERYDAY_MODULES) {
      expect(screen.getByRole('heading', { name: module.title })).toBeInTheDocument();
    }
    for (const module of SUPERUSER_MODULES) {
      expect(screen.queryByRole('heading', { name: module.title })).not.toBeInTheDocument();
    }
  });

  /** Moved, not removed: the way to the rest is on the page that no longer lists them. */
  it('links to the superuser page and names what is there', async () => {
    renderPage();

    const link = screen.getByRole('link', { name: /Superbruker/ });
    expect(link).toHaveAttribute('href', '/superbruker');
    expect(link).toHaveTextContent('Ferdigheter, Embeddings, Søk');
  });
});
