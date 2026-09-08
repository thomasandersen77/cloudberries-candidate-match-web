import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChatPage from '../ChatPage';

vi.mock('../../../services/chatService', () => ({
  searchChat: vi.fn().mockResolvedValue({
    mode: 'structured',
    latencyMs: 123,
    results: [
      { consultantId: 'u1', name: 'Alice', score: 0.87, highlights: ['kotlin','spring'] }
    ],
    conversationId: 'conv-1'
  })
}));

describe('ChatPage', () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it('renders tabs and switches', async () => {
    render(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    );

    expect(screen.getByTestId('chat-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('ai-search-tab')).toBeInTheDocument();
    expect(screen.getByTestId('analyze-tab')).toBeInTheDocument();
  });

  it('ignores a tab index saved before the tabs swapped places', () => {
    // The old key stored an index whose meaning changed: 1 was the assistant, now it is the search
    // tool, so honouring it would land a returning reader on the opposite of what they last used.
    sessionStorage.setItem('chat.selectedTab', '1');

    render(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    );

    expect(screen.getByText('Spør om konsulenter og avrop')).toBeInTheDocument();
    expect(sessionStorage.getItem('chat.selectedTab')).toBeNull();
  });

  it('opens on the assistant, not on the search tool', () => {
    render(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    );

    // The search tab asks the reader to pick between STRUCTURED, SEMANTIC, HYBRID and RAG before
    // they have asked anything. A reader should choose what they want to know, not the engine.
    expect(screen.getByText('Spør om konsulenter og avrop')).toBeInTheDocument();
  });

  it('submits Avansert søk and shows a result', async () => {
    render(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByTestId('ai-search-tab'));

    const input = screen.getAllByLabelText('Skriv spørsmålet ditt')[0];
    fireEvent.change(input, { target: { value: 'Find consultants who know Kotlin and Spring' } });

    const send = screen.getAllByTestId('send-btn').find(el => !(el as HTMLButtonElement).disabled) ?? screen.getAllByTestId('send-btn')[0];
    fireEvent.click(send);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText(/Relevans: 87%/)).toBeInTheDocument();
    });
  });
});