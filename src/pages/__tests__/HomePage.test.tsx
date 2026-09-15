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

  /**
   * The assistant card claims the answers are built on the database. This is the part that says
   * why that is more than a promise, in the order the steps actually happen.
   *
   * Asserts the shape of the explanation, not its wording. The earlier version of this test pinned
   * the sentence "Ingen AI er involvert ennå" and stayed green while the claim was false: a
   * semantic lookup embeds the question with a model before the vector search. A copy test that
   * locks a claim makes the claim harder to fix, not truer.
   */
  it('explains that the lookup happens before the model does', async () => {
    renderPage();

    expect(screen.getByText(/Hvordan assistenten kommer fram til svaret/)).toBeInTheDocument();
    expect(screen.getByText(/Vi slår opp først/)).toBeInTheDocument();
    expect(screen.getByText(/AI-en får bare det vi fant/)).toBeInTheDocument();
    expect(screen.getByText(/Svaret peker tilbake/)).toBeInTheDocument();
    // The acronym explains nothing to somebody deciding whether to trust an answer.
    expect(screen.queryByText(/RAG|retrieval/i)).not.toBeInTheDocument();

    // Inside the assistant's own card, not a box beside it: it explains that card's claim.
    const assistantCard = screen.getByRole('heading', { name: 'Assistent' }).closest('.MuiCard-root');
    expect(assistantCard).toHaveTextContent('Hvordan assistenten kommer fram til svaret');
  });

  /**
   * The two claims the backend does not stand behind, kept out by name.
   *
   * "Ingen AI er involvert" is false for semantic search, which embeds the question with
   * gemini-embedding-001 first. "Hver påstand viser" promised claim-level provenance;
   * SourceReferenceGuard only removes sources that were not in the lookup, and lets an answer with
   * no sources through untouched. This is a regression guard on two specific false statements, not
   * a lock on the surrounding copy.
   */
  it('does not claim the lookup is model-free or that every claim carries a source', async () => {
    renderPage();

    // Case-insensitive: the same promise stood mid-sentence in the hero paragraph as well, and a
    // capitalised pattern would have walked straight past it.
    expect(screen.queryByText(/ingen AI er involvert/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/hver påstand viser/i)).not.toBeInTheDocument();
  });

  /** Both modes exist, and only one of them looks anything up. */
  it('says that the general mode answers without the database', async () => {
    renderPage();

    expect(screen.getByText(/Generell AI, svarer modellen på egen hånd/)).toBeInTheDocument();
  });

  /** Moved, not removed: the way to the rest is on the page that no longer lists them. */
  it('links to the superuser page and names what is there', async () => {
    renderPage();

    const link = screen.getByRole('link', { name: /Superbruker/ });
    expect(link).toHaveAttribute('href', '/superbruker');
    expect(link).toHaveTextContent('Ferdigheter, Embeddings, Søk');
  });
});
