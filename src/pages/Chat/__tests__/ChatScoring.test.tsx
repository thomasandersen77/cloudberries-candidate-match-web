import React from 'react';
import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatSearchTab from '../ChatSearchTab';

vi.mock('../../../services/chatService', async () => {
  return {
    searchChat: vi.fn().mockResolvedValue({
      mode: 'HYBRID',
      results: [],
      latencyMs: 123,
      conversationId: 'conv-1',
      scoring: {
        semanticWeight: 0.7,
        qualityWeight: 0.3,
        formula: 'combined = 0.7 * semanticScore + 0.3 * qualityScore',
      },
      debug: {
        interpretation: {
          route: 'HYBRID',
          semanticText: 'kotlin spring',
          consultantName: undefined,
          question: undefined,
          confidence: { route: 0.9 },
        },
      },
    }),
    analyzeContent: vi.fn(),
  };
});

vi.mock('../../../services/consultantsService', async () => {
  return {
    listConsultants: vi.fn().mockResolvedValue({ content: [], number: 0, size: 0, totalElements: 0, totalPages: 0 }),
    listConsultantCvs: vi.fn().mockResolvedValue([]),
    getConsultantByUserId: vi.fn(),
  };
});

describe('ChatSearchTab - HYBRID scoring display', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // clean storages to avoid side effects
    sessionStorage.clear();
    localStorage.clear();
  });

  it('viser scoring-vekter/formel og viser scoring i debug accordion', async () => {
    render(<ChatSearchTab />);

    // Skriv inn tekst
    const input = await screen.findByLabelText(/Skriv spørsmålet ditt/i);
    fireEvent.change(input, { target: { value: 'kotlin spring' } });

    // Klikk Send
    fireEvent.click(screen.getByRole('button', { name: /Send/i }));

    // Chips for HYBRID scoring ved header
    await screen.findByText(/Modus: HYBRID/);
    expect(screen.getByText(/w_sem=0.7/)).toBeInTheDocument();
    expect(screen.getByText(/w_qual=0.3/)).toBeInTheDocument();
    expect(screen.getAllByText(/combined/)[0]).toBeInTheDocument();

    // Åpne debug-accordion
    const debugHeader = screen.getByText(/Debug-detaljer/i);
    fireEvent.click(debugHeader);

    // Skoring JSON skal vises
    await waitFor(() => {
      expect(screen.getByText(/HYBRID scoring/i)).toBeInTheDocument();
      expect(screen.getByText(/semanticWeight/)).toBeInTheDocument();
      expect(screen.getByText(/qualityWeight/)).toBeInTheDocument();
    });
  });
});
