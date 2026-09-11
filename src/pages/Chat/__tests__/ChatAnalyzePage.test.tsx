import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ChatAnalyzePage from '../ChatAnalyzePage';
import { analyzeContent, clearAnalyzeConversation } from '../../../services/chatService';
import { listProjectRequests } from '../../../services/projectRequestsService';
import { runProjectMatching } from '../../../api/matchingApi';

vi.mock('../../../services/chatService', () => ({
  analyzeContent: vi.fn(),
  clearAnalyzeConversation: vi.fn().mockResolvedValue(undefined)
}));
// The examples are written around rows read from the database, so the page reads three small
// lists at load. Every one of them is optional: a failure leaves the list shorter rather than
// naming a consultant who is not there.
vi.mock('../../../services/projectRequestsService', () => ({
  listProjectRequests: vi.fn().mockResolvedValue([
    { id: 8, customerName: 'Skatteetaten', title: 'Rådgiver skatteprosessen' }
  ])
}));
vi.mock('../../../services/consultantsService', () => ({
  listConsultantsWithCvPaged: vi.fn().mockResolvedValue({
    content: [{ name: 'Thomas Andersen' }, { name: 'Joachim Lous' }, { name: 'Einar Flobak' }]
  })
}));
vi.mock('../../../services/skillsService', () => ({
  listSkillSummary: vi.fn().mockResolvedValue({
    content: [{ name: 'Kotlin', consultantCount: 40 }, { name: 'Kafka', consultantCount: 21 }]
  })
}));
vi.mock('../../../api/matchingApi', () => ({
  runProjectMatching: vi.fn().mockResolvedValue(undefined)
}));

const mockedAnalyze = vi.mocked(analyzeContent);
const mockedClear = vi.mocked(clearAnalyzeConversation);
const mockedListRequests = vi.mocked(listProjectRequests);
const mockedRunMatching = vi.mocked(runProjectMatching);

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
    mockedListRequests.mockResolvedValue([] as never);
  });

  it('shows the answer, its kind and its sources', async () => {
    mockedAnalyze.mockResolvedValue(factualAnswer);
    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);

    ask('Hva kan Thomas Andersen best?');

    await waitFor(() => {
      expect(screen.getByText(/sterkest på Kotlin/)).toBeInTheDocument();
    });
    expect(screen.getByText('Databasefakta')).toBeInTheDocument();
    expect(screen.getByText('K1 Thomas Andersen')).toBeInTheDocument();
  });

  /**
   * Whether a model was called was only visible in the backend log. An answer read straight out of
   * the database and one a model wrote looked identical in the UI.
   */
  it('shows which model answered, and says so when none did', async () => {
    mockedAnalyze.mockResolvedValueOnce({ ...factualAnswer, latencyMs: 2783 });
    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);

    ask('Hva kan Thomas Andersen best?');
    await waitFor(() => expect(screen.getByText('claude-haiku-4-5 • 2.8 s')).toBeInTheDocument());

    mockedAnalyze.mockResolvedValueOnce({
      ...factualAnswer,
      answer: 'Ingenting i basen dekker spørsmålet.',
      answerKind: 'NO_GROUNDING',
      sources: [],
      modelUsed: 'none',
      latencyMs: 48
    });
    ask('Hva er meningen med livet?');

    await waitFor(() => expect(screen.getByText('uten modellkall')).toBeInTheDocument());
  });

  it('sends no conversationId on the first turn and the server id on the next', async () => {
    mockedAnalyze.mockResolvedValue(factualAnswer);
    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);

    ask('Hva kan Thomas Andersen best?');
    await waitFor(() => expect(mockedAnalyze).toHaveBeenCalledTimes(1));
    expect(mockedAnalyze.mock.calls[0][0]).toMatchObject({
      content: 'Hva kan Thomas Andersen best?',
      scope: 'DATABASE'
    });
    expect((mockedAnalyze.mock.calls[0][0] as { conversationId?: string }).conversationId).toBeUndefined();

    ask('Og hva mer?');
    await waitFor(() => expect(mockedAnalyze).toHaveBeenCalledTimes(2));
    // Without this the backend mints a new id per turn and the conversation has no memory.
    expect(mockedAnalyze.mock.calls[1][0]).toMatchObject({
      content: 'Og hva mer?',
      scope: 'DATABASE',
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
    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);

    ask('Passer Thomas til avrop 8?');

    await waitFor(() => expect(screen.getByText('Ny AI-vurdering')).toBeInTheDocument());
    expect(screen.queryByText('Tidligere match')).not.toBeInTheDocument();
  });

  // ------------------------------------------------------------------ scope

  /**
   * The mode is chosen, never inferred. In DATABASE a question naming a known technology is read as
   * a consultant search, so "Hva er Kafka?" returns people rather than an explanation; guessing
   * between "general question" and "found nothing" would answer the wrong one confidently.
   */
  it('sends the internal-data scope by default', async () => {
    mockedAnalyze.mockResolvedValue(factualAnswer);
    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);

    ask('Hvem kan Kafka?');

    await waitFor(() => expect(mockedAnalyze).toHaveBeenCalled());
    expect(mockedAnalyze.mock.calls[0][0]).toMatchObject({ scope: 'DATABASE' });
  });

  it('sends the general scope once the switch is flipped', async () => {
    mockedAnalyze.mockResolvedValue({
      ...factualAnswer,
      answer: 'Kafka er en distribuert meldingslogg.',
      answerKind: 'GENERAL',
      sources: []
    });
    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);

    fireEvent.click(screen.getByRole('button', { name: 'Generell AI' }));
    ask('Hva er Kafka?');

    await waitFor(() => expect(mockedAnalyze).toHaveBeenCalled());
    expect(mockedAnalyze.mock.calls[0][0]).toMatchObject({ scope: 'GENERAL' });
    await waitFor(() => expect(screen.getByText('Generelt AI-svar')).toBeInTheDocument());
  });

  /**
   * Offered after the fact rather than as a mode the reader had to predict: the point where they
   * learn nothing in the database covered the question is the point to offer the alternative.
   */
  it('offers a general answer after a question found no grounding', async () => {
    mockedAnalyze.mockResolvedValueOnce({
      ...factualAnswer,
      answer: 'Jeg fant ingenting i basen som spørsmålet peker på.',
      answerKind: 'NO_GROUNDING',
      sources: [],
      modelUsed: 'none'
    });
    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);

    ask('Hvordan bør et tilbud struktureres?');
    await waitFor(() => expect(screen.getByText('Uten grunnlag')).toBeInTheDocument());

    mockedAnalyze.mockResolvedValueOnce({
      ...factualAnswer,
      answer: 'Et tilbud bør starte med sammendrag.',
      answerKind: 'GENERAL',
      sources: []
    });
    fireEvent.click(screen.getByRole('button', { name: /spør modellen generelt/i }));

    await waitFor(() => expect(screen.getByText('Generelt AI-svar')).toBeInTheDocument());
    // The same question, in the other scope, without retyping it.
    expect(mockedAnalyze.mock.calls[1][0]).toMatchObject({
      content: 'Hvordan bør et tilbud struktureres?',
      scope: 'GENERAL'
    });
  });

  // ---------------------------------------------------------- result cards

  /**
   * The answer text says the same in prose; a reader wants to act on it. The similarity is shown as
   * a similarity and never as a percentage match: two unrelated CVs sit around 0.80 with the
   * current embedding model, so the number orders a list and says nothing on its own.
   */
  /**
   * A comparison is read from the typed field, not parsed out of the prose. The scores come from
   * one screening prompt on one scale, which is the only reason the rows can be put side by side.
   */
  it('renders a comparison as a table from the typed field', async () => {
    mockedAnalyze.mockResolvedValue({
      ...factualAnswer,
      answer: 'Ny sammenligning mot avrop 8.',
      answerKind: 'AD_HOC_EVALUATION',
      sources: [],
      comparison: [
        { ref: 'K2', consultantUserId: 'user-joachim', name: 'Joachim Lous', score: 7.9 },
        { ref: 'K1', consultantUserId: 'user-thomas', name: 'Thomas Andersen', score: 7.4 }
      ]
    } as never);

    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);
    ask('Hvem passer best av Joachim og Thomas?');

    expect(await screen.findByText('K2 Joachim Lous')).toBeInTheDocument();
    expect(screen.getByText('7.9 / 10')).toBeInTheDocument();
    expect(screen.getByText('7.4 / 10')).toBeInTheDocument();
  });

  /**
   * A candidate the run could not score shows no number. A zero would rank it last on evidence
   * nobody has, and a failed call is not a bad candidate.
   */
  it('shows a candidate that could not be scored without inventing a number', async () => {
    mockedAnalyze.mockResolvedValue({
      ...factualAnswer,
      answer: 'Ny sammenligning, 1 av 2 vurdert.',
      answerKind: 'AD_HOC_EVALUATION',
      sources: [],
      comparison: [
        { ref: 'K1', consultantUserId: 'user-thomas', name: 'Thomas Andersen', score: 7.4 },
        {
          ref: 'K2', consultantUserId: 'user-einar', name: 'Einar Flobak',
          notScoredReason: 'Vurderingen feilet for denne konsulenten.'
        }
      ]
    } as never);

    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);
    ask('Hvem passer best?');

    expect(await screen.findByText('ikke vurdert')).toBeInTheDocument();
    expect(screen.queryByText('0.0 / 10')).not.toBeInTheDocument();
  });

  /**
   * A comparison row and a source chip for the same person is the same duplication the search
   * cards already had: "K1 Thomas Andersen" in the table and again as a chip underneath it.
   */
  it('does not repeat a compared consultant as a source chip', async () => {
    mockedAnalyze.mockResolvedValue({
      ...factualAnswer,
      answer: 'Ny sammenligning mot avrop 8.',
      answerKind: 'AD_HOC_EVALUATION',
      sources: [
        { ref: 'A1', kind: 'PROJECT_REQUEST' as const, label: 'Skatteetaten' },
        {
          ref: 'K1', kind: 'CONSULTANT' as const, label: 'Thomas Andersen',
          consultantUserId: 'user-thomas', consultantCvId: 'cv-thomas'
        }
      ],
      comparison: [
        { ref: 'K1', consultantUserId: 'user-thomas', name: 'Thomas Andersen', score: 7.4 }
      ]
    } as never);

    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);
    ask('Hvem passer best?');

    expect(await screen.findByText('K1 Thomas Andersen')).toBeInTheDocument();
    // Once, in the table. The request keeps its chip: a table row cannot express it.
    expect(screen.getAllByText('K1 Thomas Andersen')).toHaveLength(1);
    expect(screen.getByText(/A1 Skatteetaten/)).toBeInTheDocument();
  });

  /**
   * The other direction: one consultant against several requests. Same typed field, same reason
   * for having one, and the row carries the request's role so two rows from the same customer are
   * telling apart.
   */
  it('renders a request fit search as a table from the typed field', async () => {
    mockedAnalyze.mockResolvedValue({
      ...factualAnswer,
      answer: 'Ny vurdering av Thomas Andersen mot 2 av 2 avrop.',
      answerKind: 'AD_HOC_EVALUATION',
      sources: [],
      comparison: [],
      requestFit: [
        {
          ref: 'A1', projectRequestId: 8, customerName: 'Skatteetaten',
          role: 'Rådgiver skatteprosessen', score: 8.6
        },
        {
          ref: 'A2', projectRequestId: 10, customerName: 'Øren',
          notScoredReason: 'Vurderingen feilet for dette avropet.'
        }
      ]
    } as never);

    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);
    ask('Hvilke avråd passer Thomas Andersen til?');

    expect(await screen.findByText('A1 Skatteetaten')).toBeInTheDocument();
    expect(screen.getByText('Rådgiver skatteprosessen')).toBeInTheDocument();
    expect(screen.getByText('8.6 / 10')).toBeInTheDocument();
    // A request the run could not score shows no number, exactly as an unscored candidate does.
    expect(screen.getByText('ikke vurdert')).toBeInTheDocument();
    expect(screen.queryByText('0.0 / 10')).not.toBeInTheDocument();
  });

  /**
   * A tie between two people is a choice, and the choice has to reach the server as an id. The
   * button used to be rendered for consultants and do nothing: the handler took requests only.
   */
  it('pins the consultant the reader picked out of an ambiguous name', async () => {
    mockedAnalyze.mockResolvedValueOnce({
      ...factualAnswer,
      answer: 'Navnet «Thomas» passer flere i basen: Thomas Andersen, Thomas Ruud.',
      answerKind: 'NO_GROUNDING',
      sources: [],
      comparison: [],
      readings: [{
        kind: 'CONSULTANT' as const,
        written: 'Thomas',
        readAs: null,
        status: 'AMBIGUOUS' as const,
        origin: 'DATABASE_EXACT' as const,
        alternatives: [
          { id: 'user-t1', label: 'Thomas Andersen' },
          { id: 'user-t2', label: 'Thomas Ruud' }
        ]
      }]
    } as never);
    mockedAnalyze.mockResolvedValueOnce({ ...factualAnswer, readings: [] } as never);

    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);
    ask('Hvilke avrop passer Thomas til?');

    fireEvent.click(await screen.findByRole('button', { name: 'Thomas Ruud' }));

    await waitFor(() => expect(mockedAnalyze).toHaveBeenCalledTimes(2));
    expect(mockedAnalyze).toHaveBeenLastCalledWith(
      expect.objectContaining({
        // The question that was interrupted, not the word that was ambiguous.
        content: 'Hvilke avrop passer Thomas til?',
        pinnedConsultantUserId: 'user-t2'
      })
    );
    // A consultant id is not a request id, and sending it as one would look up nothing.
    expect(mockedAnalyze).toHaveBeenLastCalledWith(
      expect.not.objectContaining({ pinnedRequestId: expect.anything() })
    );
  });

  /**
   * An example fills the field and stops there. Some of them start a run of paid screenings, so
   * the reader gets to see the question, and change it, before it costs anything.
   */
  it('puts a picked example in the field without sending it', async () => {
    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);

    fireEvent.click(screen.getByText('Hvilke avrop har vi?'));

    expect(screen.getByLabelText('Spørsmål')).toHaveValue('Hvilke avrop har vi?');
    expect(mockedAnalyze).not.toHaveBeenCalled();
  });

  /** The names in the examples are rows from this database, not names written into the source. */
  it('writes the examples around consultants and customers that exist', async () => {
    mockedListRequests.mockResolvedValue([
      { id: 8, customerName: 'Skatteetaten', title: 'Rådgiver skatteprosessen' }
    ] as never);

    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);

    expect(await screen.findByText('Hvem kan Kotlin og Kafka?')).toBeInTheDocument();
    expect(await screen.findByText('Hva krever Skatteetaten-avropet?')).toBeInTheDocument();
    expect(await screen.findByText('Hva kan Thomas Andersen best?')).toBeInTheDocument();
  });

  /** Six to start with. Eleven at once is a search page, not a choice. */
  it('holds the rest of the examples back behind a button', async () => {
    mockedListRequests.mockResolvedValue([
      { id: 8, customerName: 'Skatteetaten', title: 'Rådgiver skatteprosessen' }
    ] as never);

    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);
    // The button only exists once more examples have been built than are shown.
    const showMore = await screen.findByRole('button', { name: 'Vis flere eksempler' });

    expect(screen.queryByText(/Hvem er tidligere vurdert mot/)).not.toBeInTheDocument();

    fireEvent.click(showMore);

    expect(screen.getByText(/Hvem er tidligere vurdert mot/)).toBeInTheDocument();
  });

  /**
   * The examples used to be in the empty state and nowhere else, so after the first answer nothing
   * on screen said what else could be asked.
   */
  it('keeps the examples reachable once the conversation has started', async () => {
    mockedAnalyze.mockResolvedValue(factualAnswer as never);

    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);
    ask('Hva kan Thomas Andersen best?');
    await screen.findByText(/sterkest på Kotlin/);

    fireEvent.click(screen.getByRole('button', { name: 'Eksempler' }));

    expect(await screen.findByText('Hvilke avrop har vi?')).toBeInTheDocument();
  });

  /** Where a reader usually goes next, read off the answer's typed sources rather than its prose. */
  it('offers follow-ups built from the answer’s own sources', async () => {
    mockedAnalyze.mockResolvedValue(factualAnswer as never);

    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);
    ask('Hva kan Thomas Andersen best?');
    await screen.findByText(/sterkest på Kotlin/);

    // The answer cited Thomas Andersen, so the next questions are about him.
    fireEvent.click(await screen.findByText('Hvilke avrop passer Thomas Andersen til?'));

    expect(screen.getByLabelText('Spørsmål')).toHaveValue('Hvilke avrop passer Thomas Andersen til?');
    // Filled, not sent: the first call was the question, and there is no second.
    expect(mockedAnalyze).toHaveBeenCalledTimes(1);
  });

  it('renders no table on a turn that produced no comparison', async () => {
    mockedAnalyze.mockResolvedValue({ ...factualAnswer, comparison: [] } as never);

    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);
    ask('Hva kan Thomas Andersen best?');

    await screen.findByText(/sterkest på Kotlin/);
    expect(screen.queryByRole('table')).not.toBeInTheDocument();
  });

  it('renders a search hit as a card with its criteria and CV section', async () => {
    mockedAnalyze.mockResolvedValue({
      ...factualAnswer,
      answer: 'Kari passer på Kotlin [K1].',
      answerKind: 'SEARCH_RESULT',
      sources: [
        {
          ref: 'K1',
          kind: 'CONSULTANT' as const,
          label: 'Kari Nordmann',
          consultantUserId: 'user-kari',
          consultantCvId: 'cv-kari',
          retrieval: {
            method: 'HYBRID' as const,
            documentedSkills: [{ name: 'Kotlin', years: 9 }],
            cvQualityScore: 76,
            semanticSimilarity: 0.86,
            bestChunkLabel: 'Prosjekt: Skatteetaten'
          }
        }
      ]
    });
    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);

    ask('Hvem har jobbet med modernisering av Java-systemer?');

    await waitFor(() => expect(screen.getByText('Krav filtrert, likhet rangert')).toBeInTheDocument());
    expect(screen.getByText('Oppfyller: Kotlin (9 år)')).toBeInTheDocument();
    expect(screen.getByText('Traff i CV-en: Prosjekt: Skatteetaten')).toBeInTheDocument();
    expect(screen.getByText('CV-kvalitet 76')).toBeInTheDocument();
    // A similarity, not a percentage.
    expect(screen.getByText('Likhet 0.86')).toBeInTheDocument();
    expect(screen.queryByText(/86 ?%/)).not.toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Se CV' })).toHaveAttribute('href', '/consultants/user-kari');
  });

  it('reuses the turn id when retrying, so the server can replay its answer', async () => {
    mockedAnalyze.mockRejectedValueOnce(new Error('network'));
    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);

    ask('Hvem kan Kotlin?');
    await waitFor(() => expect(screen.getByText(/Spørsmålet feilet/)).toBeInTheDocument());

    mockedAnalyze.mockResolvedValueOnce(factualAnswer);
    fireEvent.click(screen.getByRole('button', { name: /prøv igjen/i }));
    await waitFor(() => expect(mockedAnalyze).toHaveBeenCalledTimes(2));

    // The client cannot tell whether the first attempt was saved; the same key lets the server say.
    const first = mockedAnalyze.mock.calls[0][0] as { turnId?: string };
    const second = mockedAnalyze.mock.calls[1][0] as { turnId?: string };
    expect(first.turnId).toBeTruthy();
    expect(second.turnId).toBe(first.turnId);
  });

  /**
   * The dev proxy answers 500 with an empty body when the backend is not running, which is
   * indistinguishable from an application error unless the message says which is more likely. A
   * bare "Spørsmålet feilet" sent a reader looking for a bug that was not there.
   */
  it('says the server may be down when the failure looks like that', async () => {
    mockedAnalyze.mockRejectedValueOnce({ response: { status: 500 } });
    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);

    ask('Hvem kan Kotlin?');

    await waitFor(() => expect(screen.getByText(/Serveren svarte 500/)).toBeInTheDocument());
    expect(screen.getByText(/backend ikke kjører/)).toBeInTheDocument();
  });

  it('says there was no answer at all when there is no response', async () => {
    mockedAnalyze.mockRejectedValueOnce(new Error('Network Error'));
    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);

    ask('Hvem kan Kotlin?');

    await waitFor(() => expect(screen.getByText(/Ingen svar fra serveren/)).toBeInTheDocument());
  });

  // ---------------------------------------------------- count, more, matching

  it('sends the chosen result count and doubles it on vis flere', async () => {
    const fiveHits = Array.from({ length: 5 }, (_, i) => ({
      ref: `K${i + 1}`,
      kind: 'CONSULTANT' as const,
      label: `Konsulent ${i + 1}`,
      consultantUserId: `user-${i + 1}`,
      retrieval: { method: 'EXACT_SKILLS' as const, documentedSkills: [{ name: 'Kotlin', years: 5 }] }
    }));
    mockedAnalyze.mockResolvedValue({
      ...factualAnswer, answer: 'Fem treff.', answerKind: 'SEARCH_RESULT', sources: fiveHits
    });
    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);

    ask('Hvem kan Kotlin?');
    await waitFor(() => expect(mockedAnalyze).toHaveBeenCalled());
    expect(mockedAnalyze.mock.calls[0][0]).toMatchObject({ topK: 5 });

    fireEvent.click(await screen.findByRole('button', { name: /vis flere/i }));
    await waitFor(() => expect(mockedAnalyze).toHaveBeenCalledTimes(2));
    // A wider retrieval, not a page of a cached one, so the model can cite the wider set.
    expect(mockedAnalyze.mock.calls[1][0]).toMatchObject({ content: 'Hvem kan Kotlin?', topK: 10 });
  });

  it('hands the picked consultants to the matching run for a chosen request', async () => {
    mockedListRequests.mockResolvedValue([
      { id: 8, customerName: 'Skatteetaten', title: 'Forespørsel' }
    ] as never);
    mockedRunMatching.mockResolvedValue(undefined as never);
    mockedAnalyze.mockResolvedValue({
      ...factualAnswer,
      answer: 'Ett treff.',
      answerKind: 'SEARCH_RESULT',
      sources: [{
        ref: 'K1', kind: 'CONSULTANT' as const, label: 'Kari Nordmann',
        consultantUserId: 'user-kari',
        retrieval: { method: 'EXACT_SKILLS' as const, documentedSkills: [] }
      }]
    });
    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);

    ask('Hvem kan Kotlin?');
    await waitFor(() => expect(screen.getByText('K1 Kari Nordmann')).toBeInTheDocument());

    fireEvent.click(screen.getByRole('checkbox', { name: /velg kari nordmann/i }));
    await waitFor(() => expect(screen.getByText(/1 valgt/)).toBeInTheDocument());

    fireEvent.mouseDown(screen.getByLabelText('Avrop'));
    fireEvent.click(await screen.findByRole('option', { name: /Skatteetaten/ }));
    fireEvent.click(screen.getByRole('button', { name: /kjør matching/i }));

    // Named consultants go to the run endpoint verbatim, which skips preselection for them: an
    // operator who has picked people should get those people evaluated.
    await waitFor(() => expect(mockedRunMatching).toHaveBeenCalledWith(8, { consultantUserIds: ['user-kari'] }));
  });

  it('says so when the matching run could not be started', async () => {
    mockedListRequests.mockResolvedValue([{ id: 8, customerName: 'Skatteetaten' }] as never);
    mockedRunMatching.mockRejectedValue(new Error('boom') as never);
    mockedAnalyze.mockResolvedValue({
      ...factualAnswer,
      answerKind: 'SEARCH_RESULT',
      sources: [{
        ref: 'K1', kind: 'CONSULTANT' as const, label: 'Kari Nordmann',
        consultantUserId: 'user-kari',
        retrieval: { method: 'EXACT_SKILLS' as const, documentedSkills: [] }
      }]
    });
    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);

    ask('Hvem kan Kotlin?');
    await waitFor(() => expect(screen.getByText('K1 Kari Nordmann')).toBeInTheDocument());
    fireEvent.click(screen.getByRole('checkbox', { name: /velg kari nordmann/i }));
    fireEvent.mouseDown(screen.getByLabelText('Avrop'));
    fireEvent.click(await screen.findByRole('option', { name: /Skatteetaten/ }));
    fireEvent.click(screen.getByRole('button', { name: /kjør matching/i }));

    await waitFor(() => expect(screen.getByText(/Kunne ikke starte matchekjøringen/)).toBeInTheDocument());
  });

  it('says so when the server did not confirm the deletion', async () => {
    mockedAnalyze.mockResolvedValue(factualAnswer);
    mockedClear.mockRejectedValueOnce(new Error('offline'));
    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);

    ask('Hva kan Thomas Andersen best?');
    await waitFor(() => expect(screen.getByText(/sterkest på Kotlin/)).toBeInTheDocument());

    fireEvent.click(screen.getByRole('button', { name: /ny samtale/i }));

    // Saying nothing left the impression the turns were gone when they were not; they quote CV and
    // document text and only expire after 24 hours.
    await waitFor(() => expect(screen.getByText(/serveren svarte ikke på slettingen/i)).toBeInTheDocument());
  });

  it('clears the conversation on the server too', async () => {
    mockedAnalyze.mockResolvedValue(factualAnswer);
    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);

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
    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);

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
    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);

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
    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);

    ask('Hva krever avrop 10?');

    await waitFor(() => expect(screen.getByText('A1 Øren')).toBeInTheDocument());
    expect(
      screen.getByLabelText(/dokumenttype ikke verifisert/i)
    ).toBeInTheDocument();
  });

  it('offers the candidates as buttons and picks one by id, not by re-sending the wording', async () => {
    // The wording is what was ambiguous. A button that re-sent it would reach the same tie again
    // and ask the reader the same question a second time.
    mockedAnalyze.mockResolvedValue({
      ...factualAnswer,
      answer: 'Jeg fant 2 avrop som passer «sparebank». Hvilket mener du?',
      answerKind: 'NO_GROUNDING' as const,
      sources: [],
      modelUsed: 'none',
      readings: [
        {
          kind: 'PROJECT_REQUEST' as const,
          written: 'sparebank',
          status: 'AMBIGUOUS' as const,
          origin: 'DATABASE_EXACT' as const,
          alternatives: [
            { id: '9002', label: 'Sparebank 1 Østlandet' },
            { id: '9003', label: 'Sparebank 1 Nord-Norge' }
          ]
        }
      ]
    });
    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);

    ask('Hva krever Sparebank-avropet?');

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Sparebank 1 Østlandet' })).toBeInTheDocument()
    );
    mockedAnalyze.mockClear();
    fireEvent.click(screen.getByRole('button', { name: 'Sparebank 1 Østlandet' }));

    await waitFor(() => expect(mockedAnalyze).toHaveBeenCalled());
    expect(mockedAnalyze.mock.calls[0][0]).toMatchObject({
      content: 'Hva krever Sparebank-avropet?',
      pinnedRequestId: 9002
    });
  });

  it('answers a choice once, and locks the alternatives after it is answered', async () => {
    // While the buttons stayed live it was possible to pick Østlandet, read the answer, then pick
    // Nord-Norge on the same question and get a second, contradictory answer to it.
    // Ambiguous first, then the answer the choice produces, so only one turn carries buttons.
    mockedAnalyze
      .mockResolvedValueOnce({
        ...factualAnswer,
        answer: 'Jeg fant 2 avrop som passer «sparebank». Hvilket mener du?',
        answerKind: 'NO_GROUNDING' as const,
        sources: [],
        modelUsed: 'none',
        readings: [
          {
            kind: 'PROJECT_REQUEST' as const,
            written: 'sparebank',
            status: 'AMBIGUOUS' as const,
            origin: 'DATABASE_EXACT' as const,
            alternatives: [
              { id: '9002', label: 'Sparebank 1 Østlandet' },
              { id: '9003', label: 'Sparebank 1 Nord-Norge' }
            ]
          }
        ]
      })
      .mockResolvedValue({ ...factualAnswer, answer: 'Avropet krever Java og Kafka [A1].' });
    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);

    ask('Hva krever Sparebank-avropet?');
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Sparebank 1 Østlandet' })).toBeInTheDocument()
    );

    fireEvent.click(screen.getByRole('button', { name: 'Sparebank 1 Østlandet' }));

    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Sparebank 1 Nord-Norge' })).toBeDisabled()
    );
    expect(screen.getByRole('button', { name: 'Sparebank 1 Østlandet' })).toBeDisabled();
  });

  it('calls a missing duration unknown rather than showing zero years', async () => {
    mockedAnalyze.mockResolvedValue({
      ...factualAnswer,
      answerKind: 'SEARCH_RESULT' as const,
      sources: [
        {
          ref: 'K1',
          kind: 'CONSULTANT' as const,
          label: 'Johan Loudon',
          consultantUserId: 'user-johan',
          retrieval: {
            method: 'EXACT_SKILLS' as const,
            documentedSkills: [{ name: 'Java', years: null }, { name: 'Kafka', years: 6 }]
          }
        }
      ]
    });
    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);

    ask('hvem kan java');

    await waitFor(() => expect(screen.getByText(/Oppfyller:/)).toBeInTheDocument());
    expect(screen.getByText(/Java \(ukjent varighet\)/)).toBeInTheDocument();
    expect(screen.queryByText(/0 år/)).not.toBeInTheDocument();
  });

  it('says a name was corrected instead of quietly using the corrected one', async () => {
    mockedAnalyze.mockResolvedValue({
      ...factualAnswer,
      readings: [
        {
          kind: 'CONSULTANT' as const,
          written: 'Joacim',
          readAs: 'Joachim Lous',
          status: 'CORRECTED' as const,
          origin: 'DATABASE_FUZZY' as const,
          alternatives: []
        }
      ]
    });
    render(<MemoryRouter><ChatAnalyzePage /></MemoryRouter>);

    ask('Hva kan Joacim?');

    await waitFor(() =>
      expect(screen.getByText('«Joacim» er lest som Joachim Lous')).toBeInTheDocument()
    );
  });
});
