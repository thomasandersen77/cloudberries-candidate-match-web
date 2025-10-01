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

  it('submits AI-søk and shows a result', async () => {
    render(
      <MemoryRouter>
        <ChatPage />
      </MemoryRouter>
    );

    const input = screen.getByLabelText('Skriv spørsmålet ditt');
    fireEvent.change(input, { target: { value: 'Find consultants who know Kotlin and Spring' } });

    const send = screen.getByTestId('send-btn');
    fireEvent.click(send);

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
      expect(screen.getByText(/Relevans: 87%/)).toBeInTheDocument();
    });
  });
});