import React from 'react';
import { it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { MemoryRouter } from 'react-router-dom';
import SemanticSearchPage from '../SemanticSearchPage';
import { searchConsultantsSemantic } from '../../../services/consultantsService';

vi.mock('../../../services/consultantsService', () => ({
  getEmbeddingInfo: vi.fn().mockResolvedValue({ enabled: true, provider: 'GOOGLE_GEMINI', model: 'gemini-embedding-001', dimension: 768 }),
  searchConsultantsSemantic: vi.fn(),
}));

beforeEach(() => vi.clearAllMocks());

const hit = (userId: string, name: string, semanticScore: number, qualityScore: number) => ({
  userId, name, cvId: `cv-${userId}`, skills: ['Kotlin'], semanticScore, cvs: [{ active: true, qualityScore }],
});

/**
 * The backend answers in order of similarity and sends the score; the table sorted the rows
 * again by CV quality, so a well-written but less relevant CV came out on top of the best hit.
 */
it('keeps the backend order and shows similarity beside CV quality', async () => {
  vi.mocked(searchConsultantsSemantic).mockResolvedValue({
    content: [hit('u1', 'Relevant Rolfsen', 0.95, 50), hit('u2', 'Pen Pedersen', 0.7, 95)],
    number: 0, size: 10, totalElements: 2, totalPages: 1,
  } as never);
  render(<MemoryRouter><SemanticSearchPage /></MemoryRouter>);

  fireEvent.change(screen.getByLabelText('Skriv spørsmålet ditt'), { target: { value: 'Kotlin og Kafka' } });
  fireEvent.click(screen.getByRole('button', { name: /^Søk/ }));

  await screen.findByText('Pen Pedersen');
  const rows = screen.getAllByRole('row').slice(1);
  expect(rows.map(r => within(r).getAllByRole('cell')[0].textContent)).toEqual(['Relevant Rolfsen', 'Pen Pedersen']);
  expect(within(rows[0]).getByText('0.95')).toBeInTheDocument();
  expect(within(rows[0]).getByText('50%')).toBeInTheDocument();
  expect(screen.getByRole('columnheader', { name: 'Likhet' })).toBeInTheDocument();
});
