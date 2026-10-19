import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

vi.mock('../../../services/consultantsService', () => ({
  getEmbeddingInfo: vi.fn().mockResolvedValue({ enabled: true, provider: 'GOOGLE_GEMINI', model: 'gemini-embedding-001', dimension: 768 }),
}));
vi.mock('../../../services/embeddingsService', () => ({
  runForUserCv: vi.fn(),
  getEmbeddingFreshness: vi.fn(),
  rebuildWholeCvEmbeddings: vi.fn(),
  rebuildChunkEmbeddings: vi.fn(),
}));

import EmbeddingsPage from '../EmbeddingsPage';
import { getEmbeddingFreshness, rebuildChunkEmbeddings, rebuildWholeCvEmbeddings } from '../../../services/embeddingsService';

const freshness = {
  provider: 'GOOGLE_GEMINI',
  model: 'gemini-embedding-001',
  eligible: 3,
  wholeCv: { missing: 1, stale: 1, current: 1, nothingToEmbed: 0 },
  chunks: { missing: 1, stale: 1, current: 1, nothingToEmbed: 0 },
  consultants: [
    { userId: 'u1', name: 'Cy Mangler', cvId: 'c1', wholeCv: { state: 'MISSING' }, chunks: { state: 'MISSING', chunks: 0 } },
    { userId: 'u2', name: 'Bo Utdatert', cvId: 'c2', wholeCv: { state: 'STALE', embeddedAt: '2026-03-21T10:00:00' }, chunks: { state: 'STALE', chunks: 9 } },
    { userId: 'u3', name: 'Ada Oppdatert', cvId: 'c3', wholeCv: { state: 'CURRENT', embeddedAt: '2026-10-19T20:00:00' }, chunks: { state: 'CURRENT', chunks: 12 } },
  ],
};
const done = { processed: 3, created: 0, updated: 1, skipped: 2, failed: 0, rateLimited: 0, totalChunks: 9, provider: 'GOOGLE_GEMINI', model: 'm', dimension: 768 };

const renderPage = () => render(<MemoryRouter><EmbeddingsPage /></MemoryRouter>);

describe('EmbeddingsPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(getEmbeddingFreshness).mockResolvedValue(freshness as never);
    vi.mocked(rebuildWholeCvEmbeddings).mockResolvedValue(done as never);
    vi.mocked(rebuildChunkEmbeddings).mockResolvedValue(done as never);
  });

  /** «94 of 94» counted rows. The page now says which vectors were made from the CV as it is now. */
  it('shows how many are current, stale and missing, and lists only the ones that are not current', async () => {
    renderPage();

    expect(await screen.findByText(/1 oppdatert · 1 utdatert · 1 mangler, av 3 konsulenter/)).toBeInTheDocument();
    expect(screen.getByText('Cy Mangler')).toBeInTheDocument();
    expect(screen.getByText('Bo Utdatert')).toBeInTheDocument();
    expect(screen.queryByText('Ada Oppdatert')).not.toBeInTheDocument();

    fireEvent.click(screen.getByLabelText('Vis også oppdaterte'));
    expect(screen.getByText('Ada Oppdatert')).toBeInTheDocument();
  });

  /** It called the batch for missing vectors, with no force, so it rebuilt nothing once all had one. */
  it('sends force to both rebuilds when Force rebuild is confirmed', async () => {
    renderPage();
    await screen.findByText('Cy Mangler');

    fireEvent.click(screen.getByRole('button', { name: 'Force rebuild' }));
    const dialog = await screen.findByRole('dialog');
    expect(within(dialog).getByText(/omtrent 24 kall/)).toBeInTheDocument();
    fireEvent.click(within(dialog).getByRole('button', { name: 'Fortsett' }));

    await waitFor(() => expect(rebuildChunkEmbeddings).toHaveBeenCalled());
    expect(rebuildWholeCvEmbeddings).toHaveBeenCalledWith({ force: true, order: 'DATABASE', limit: undefined });
    expect(rebuildChunkEmbeddings).toHaveBeenCalledWith({ force: true, order: 'DATABASE', limit: undefined });
  });

  it('builds only what is missing or stale, in the order and up to the limit chosen', async () => {
    renderPage();
    await screen.findByText('Cy Mangler');

    fireEvent.mouseDown(screen.getByLabelText('Rekkefølge'));
    fireEvent.click(await screen.findByRole('option', { name: 'Eldste vektor først' }));
    fireEvent.change(screen.getByLabelText('Maks antall konsulenter'), { target: { value: '10' } });
    fireEvent.click(screen.getByRole('button', { name: 'Bygg manglende og utdaterte' }));

    await waitFor(() => expect(rebuildChunkEmbeddings).toHaveBeenCalled());
    expect(rebuildWholeCvEmbeddings).toHaveBeenCalledWith({ force: false, order: 'OLDEST_FIRST', limit: 10 });
    expect(await screen.findByText(/1 bygget, 2 uendret/)).toBeInTheDocument();
  });
});
