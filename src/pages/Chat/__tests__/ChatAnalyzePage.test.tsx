import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ChatAnalyzePage from '../ChatAnalyzePage';
import { analyzeContent, clearAnalyzeConversation } from '../../../services/chatService';

vi.mock('../../../services/chatService', () => ({
  analyzeContent: vi.fn(),
  clearAnalyzeConversation: vi.fn().mockResolvedValue(undefined)
}));

const mockedAnalyze = vi.mocked(analyzeContent);
const mockedClear = vi.mocked(clearAnalyzeConversation);

const factualAnswer = {
  conversationId: 'a92fb187-d0c4-4f97-8f5b-2cc1972203a5',
  answer: 'Han er sterkest på Kotlin og Spring Boot [K1].',
  answerKind: 'FACTUAL' as const,
  sources: [
    {
      ref: 'K1',
      kind: 'CONSULTANT' as const,
      label: 'Thomas Andersen',
      consultantUserId: 'user-thomas',
      consultantCvId: 'cv-thomas'
    }
  ],
  modelUsed: 'claude-haiku-4-5',
  latencyMs: 1200
};

const ask = (question: string) => {
  fireEvent.change(screen.getByLabelText('Spørsmål'), { target: { value: question } });
  fireEvent.click(screen.getByRole('button', { name: /send/i }));
};

/**
 * The endpoint used to answer with `content`; it now answers with `answer`, `answerKind` and
 * `sources`. Reading the old field showed "Ingen respons mottatt fra AI" on every successful
 * answer, so these cases pin the fields the page actually reads.
 */
describe('ChatAnalyzePage', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.clearAllMocks();
    mockedClear.mockResolvedValue(undefined);
  });

  it('shows the answer, its kind and its sources', async () => {
    mockedAnalyze.mockResolvedValue(factualAnswer);
    render(<ChatAnalyzePage />);

    ask('Hva kan Thomas Andersen best?');

    await waitFor(() => {
      expect(screen.getByText(/sterkest på Kotlin/)).toBeInTheDocument();
    });
    expect(screen.getByText('Databasefakta')).toBeInTheDocument();
    expect(screen.getByText('K1 Thomas Andersen')).toBeInTheDocument();
  });

  it('sends no conversationId on the first turn and the server id on the next', async () => {
    mockedAnalyze.mockResolvedValue(factualAnswer);
    render(<ChatAnalyzePage />);

    ask('Hva kan Thomas Andersen best?');
    await waitFor(() => expect(mockedAnalyze).toHaveBeenCalledTimes(1));
    expect(mockedAnalyze.mock.calls[0][0]).toEqual({ content: 'Hva kan Thomas Andersen best?' });

    ask('Og hva mer?');
    await waitFor(() => expect(mockedAnalyze).toHaveBeenCalledTimes(2));
    // Without this the backend mints a new id per turn and the conversation has no memory.
    expect(mockedAnalyze.mock.calls[1][0]).toEqual({
      content: 'Og hva mer?',
      conversationId: factualAnswer.conversationId
    });
  });

  it('labels a new evaluation differently from a stored match', async () => {
    mockedAnalyze.mockResolvedValue({
      ...factualAnswer,
      answer: 'Score: 74 av 100.',
      answerKind: 'AD_HOC_EVALUATION',
      modelUsed: 'matching/DEFAULT'
    });
    render(<ChatAnalyzePage />);

    ask('Passer Thomas til avrop 8?');

    await waitFor(() => expect(screen.getByText('Ny AI-vurdering')).toBeInTheDocument());
    expect(screen.queryByText('Tidligere match')).not.toBeInTheDocument();
  });

  it('clears the conversation on the server too', async () => {
    mockedAnalyze.mockResolvedValue(factualAnswer);
    render(<ChatAnalyzePage />);

    ask('Hva kan Thomas Andersen best?');
    await waitFor(() => expect(screen.getByText(/sterkest på Kotlin/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /ny samtale/i }));

    // Leaving the turns behind would keep the CV text they quote after the user asked to forget it.
    await waitFor(() => expect(mockedClear).toHaveBeenCalledWith(factualAnswer.conversationId));
    expect(screen.queryByText(/sterkest på Kotlin/)).not.toBeInTheDocument();
    expect(sessionStorage.getItem('chatAnalyzeConversationId')).toBeNull();
  });

  it('keeps the question and offers a retry when the call fails', async () => {
    mockedAnalyze.mockRejectedValueOnce(new Error('boom'));
    render(<ChatAnalyzePage />);

    ask('Hvem kan Kotlin?');

    // The turn never reached the conversation, so neither bubble stays in the transcript; the
    // question survives in the banner so it does not have to be retyped.
    await waitFor(() => expect(screen.getByText(/Spørsmålet feilet/)).toBeInTheDocument());
    expect(screen.getByText(/«Hvem kan Kotlin\?»/)).toBeInTheDocument();

    mockedAnalyze.mockResolvedValue(factualAnswer);
    fireEvent.click(screen.getByRole('button', { name: /prøv igjen/i }));

    await waitFor(() => expect(screen.getByText(/sterkest på Kotlin/)).toBeInTheDocument());
    expect(mockedAnalyze).toHaveBeenCalledTimes(2);
  });

  /**
   * The answer is markdown, so it has to render as markdown. Tables need remark-gfm; without it
   * react-markdown printed the row separators as literal pipes in the bubble.
   */
  it('renders the answer as markdown, tables included', async () => {
    mockedAnalyze.mockResolvedValue({
      ...factualAnswer,
      answer: [
        'Alle **fem** oppfyller kravene:',
        '',
        '| Konsulent | Kotlin |',
        '|---|---|',
        '| Einar Flobak | 7 år |'
      ].join('\n')
    });
    render(<ChatAnalyzePage />);

    ask('Hvem kan Kotlin?');

    await waitFor(() => expect(screen.getByRole('table')).toBeInTheDocument());
    expect(screen.getByRole('columnheader', { name: 'Konsulent' })).toBeInTheDocument();
    expect(screen.getByRole('cell', { name: 'Einar Flobak' })).toBeInTheDocument();
    expect(screen.getByText('fem').tagName).toBe('STRONG');
    // The pipes must not survive as text; that was the symptom.
    expect(screen.queryByText(/\| Konsulent \|/)).not.toBeInTheDocument();
  });

  it('shows the document behind a request source and that its kind is unverified', async () => {
    mockedAnalyze.mockResolvedValue({
      ...factualAnswer,
      answer: 'Avrop 10 stiller 19 MÅ-krav [A1].',
      sources: [
        {
          ref: 'A1',
          kind: 'PROJECT_REQUEST' as const,
          label: 'Øren',
          projectRequestId: 10,
          originalFilename: 'Sparebank 1 Tilbud.pdf'
        }
      ]
    });
    render(<ChatAnalyzePage />);

    ask('Hva krever avrop 10?');

    await waitFor(() => expect(screen.getByText('A1 Øren')).toBeInTheDocument());
    expect(
      screen.getByLabelText(/dokumenttype ikke verifisert/i)
    ).toBeInTheDocument();
  });
});
