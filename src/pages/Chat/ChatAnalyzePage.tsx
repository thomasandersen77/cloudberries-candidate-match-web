import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container, Typography, TextField, Button, Paper, CircularProgress, Stack,
  Box, Fade, Chip, Tooltip, ToggleButton, ToggleButtonGroup, Alert,
  useTheme, useMediaQuery
} from '@mui/material';
import {
  Send as SendIcon,
  SmartToy as AiIcon,
  Person as PersonIcon,
  Add as NewChatIcon,
  Description as DocumentIcon,
  Badge as ConsultantIcon,
  History as StoredMatchIcon,
  Storage as DatabaseIcon,
  Public as GeneralIcon
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { analyzeContent, clearAnalyzeConversation } from '../../services/chatService';
import type { ChatAnswerKind, ChatScope, ChatSource } from '../../types/api';

interface ChatMessage {
  id: string;
  type: 'question' | 'answer';
  content: string;
  timestamp: Date;
  loading?: boolean;
  answerKind?: ChatAnswerKind;
  sources?: ChatSource[];
  modelUsed?: string;
  latencyMs?: number;
  /** The question this answer replied to, so it can be re-asked in the other scope. */
  question?: string;
}

/**
 * How each kind of answer is labelled.
 *
 * The distinction is the point of the badge, not decoration: a stored match is a record of a
 * decision someone already made, while an ad hoc evaluation is an opinion produced for this
 * question and saved nowhere. Presenting them the same way is how the two get confused.
 */
const ANSWER_KIND_LABELS: Record<ChatAnswerKind, { label: string; color: 'default' | 'info' | 'success' | 'warning'; help: string }> = {
  FACTUAL: {
    label: 'Databasefakta',
    color: 'success',
    help: 'Lest rett ut av databasen: CV, krav eller avropsliste.'
  },
  SEARCH_RESULT: {
    label: 'Søketreff',
    color: 'info',
    help: 'Treff på et strukturert søk. Ikke en rangering av egnethet.'
  },
  STORED_MATCH: {
    label: 'Tidligere match',
    color: 'default',
    help: 'Resultat fra en tidligere matchekjøring, ikke en ny vurdering.'
  },
  AD_HOC_EVALUATION: {
    label: 'Ny AI-vurdering',
    color: 'warning',
    help: 'Vurdert nå, på forespørsel. Ikke lagret som et matcheresultat.'
  },
  NO_GROUNDING: {
    label: 'Uten grunnlag',
    color: 'default',
    help: 'Ingenting i databasen dekket spørsmålet.'
  },
  GENERAL: {
    label: 'Generelt AI-svar',
    color: 'warning',
    help: 'Modellens egen kunnskap. Ingen konsulent-, avrops- eller matchedata er brukt.'
  }
};

const SOURCE_ICONS = {
  CONSULTANT: ConsultantIcon,
  PROJECT_REQUEST: DocumentIcon,
  STORED_MATCH: StoredMatchIcon
} as const;

const MESSAGES_KEY = 'chatAnalyzeMessages';
const CONVERSATION_KEY = 'chatAnalyzeConversationId';

const ChatAnalyzePage: React.FC = () => {
  const [content, setContent] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failedQuestion, setFailedQuestion] = useState<string | null>(null);
  const [scope, setScope] = useState<ChatScope>('DATABASE');
  const [clearFailed, setClearFailed] = useState(false);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(MESSAGES_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Array<Omit<ChatMessage, 'timestamp'> & { timestamp: string }>;
        setMessages(parsed.map(m => ({ ...m, timestamp: new Date(m.timestamp) })));
      }
      setConversationId(sessionStorage.getItem(CONVERSATION_KEY));
    } catch {
      // A session without storage is a session without history, not a broken page.
    }
  }, []);

  useEffect(() => {
    try {
      sessionStorage.setItem(
        MESSAGES_KEY,
        JSON.stringify(messages.map(m => ({ ...m, timestamp: m.timestamp.toISOString() })))
      );
    } catch {
      // ignore
    }
  }, [messages]);

  // Newest last, so the conversation reads top to bottom like every other chat. Optional call
  // because scrollIntoView is not universal: jsdom has no implementation, and a missing browser
  // API should not take the page down with it.
  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const ask = useCallback(async (question: string, askScope: ChatScope = scope) => {
    if (!question.trim() || loading) return;

    const questionId = `${Date.now()}`;
    const answerId = `${questionId}_answer`;

    setMessages(prev => [
      ...prev,
      { id: questionId, type: 'question', content: question.trim(), timestamp: new Date() },
      { id: answerId, type: 'answer', content: '', timestamp: new Date(), loading: true }
    ]);
    setContent('');
    setFailedQuestion(null);
    setLoading(true);

    try {
      const res = await analyzeContent({
        content: question.trim(),
        scope: askScope,
        ...(conversationId ? { conversationId } : {})
      });

      // The server mints the id on the first turn; sending it back is what continues the
      // conversation, so it has to be kept before the next question is asked.
      setConversationId(res.conversationId);
      try {
        sessionStorage.setItem(CONVERSATION_KEY, res.conversationId);
      } catch {
        // ignore
      }

      setMessages(prev => prev.map(msg => msg.id === answerId ? {
        id: answerId,
        type: 'answer',
        content: res.answer,
        timestamp: new Date(),
        loading: false,
        answerKind: res.answerKind,
        sources: res.sources,
        modelUsed: res.modelUsed,
        latencyMs: res.latencyMs,
        question: question.trim()
      } : msg));
    } catch {
      // Both bubbles go: the turn never reached the conversation, so leaving a question in the
      // transcript with no answer under it misrepresents what the conversation contains. The text
      // is kept in the retry banner instead, so nothing has to be retyped.
      setFailedQuestion(question.trim());
      setMessages(prev => prev.filter(msg => msg.id !== answerId && msg.id !== questionId));
    } finally {
      setLoading(false);
    }
  }, [conversationId, loading, scope]);

  const onNewConversation = useCallback(async () => {
    const previous = conversationId;
    setMessages([]);
    setConversationId(null);
    setFailedQuestion(null);
    setClearFailed(false);
    try {
      sessionStorage.removeItem(MESSAGES_KEY);
      sessionStorage.removeItem(CONVERSATION_KEY);
    } catch {
      // ignore
    }
    // Clears the server side too. Leaving the turns behind would mean the CV and document text
    // they quote outlives a conversation the user asked to forget.
    if (previous) {
      try {
        await clearAnalyzeConversation(previous);
      } catch {
        // Saying nothing here left the impression that the turns were gone when they were not.
        // They quote CV and document text and expire on the server after 24 hours, so the reader
        // should know the difference between "forgotten" and "forgotten locally".
        setClearFailed(true);
      }
    }
  }, [conversationId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      ask(content);
    }
  }, [ask, content]);

  const formatTimestamp = (date: Date) =>
    date.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });

  const SourceChips: React.FC<{ sources: ChatSource[] }> = ({ sources }) => (
    <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
      {sources.map(source => {
        const Icon = SOURCE_ICONS[source.kind];
        const detail = [
          source.originalFilename && `Dokument: ${source.originalFilename} (dokumenttype ikke verifisert)`,
          source.consultantCvId && `CV: ${source.consultantCvId}`,
          source.projectRequestId != null && `Avrop ${source.projectRequestId}`,
          source.matchResultId != null && `Kjøring ${source.matchResultId}`,
          source.evaluatedAt && `Vurdert ${new Date(source.evaluatedAt).toLocaleDateString('no-NO')}`
        ].filter(Boolean).join(' • ');

        return (
          <Tooltip key={source.ref} title={detail || source.label}>
            <Chip
              icon={<Icon sx={{ fontSize: 16 }} />}
              label={`${source.ref} ${source.label}`}
              size="small"
              variant="outlined"
              sx={{ maxWidth: 320, fontSize: '0.7rem' }}
            />
          </Tooltip>
        );
      })}
    </Stack>
  );

  const MessageBubble: React.FC<{ message: ChatMessage }> = ({ message }) => {
    const isQuestion = message.type === 'question';
    const kind = message.answerKind ? ANSWER_KIND_LABELS[message.answerKind] : null;

    return (
      <Fade in timeout={300}>
        <Box sx={{ display: 'flex', justifyContent: isQuestion ? 'flex-end' : 'flex-start', mb: 2, alignItems: 'flex-start' }}>
          {!isQuestion && (
            <Box sx={{ mr: 1, mt: 0.5 }}>
              <AiIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            </Box>
          )}

          <Box sx={{
            maxWidth: isMobile ? '90%' : '78%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: isQuestion ? 'flex-end' : 'flex-start'
          }}>
            <Paper
              elevation={1}
              sx={{
                p: 2,
                backgroundColor: isQuestion ? 'primary.main' : 'grey.100',
                color: isQuestion ? 'primary.contrastText' : 'text.primary',
                borderRadius: 2,
                borderTopRightRadius: isQuestion ? 0.5 : 2,
                borderTopLeftRadius: isQuestion ? 2 : 0.5,
                wordBreak: 'break-word'
              }}
            >
              {message.loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CircularProgress size={16} />
                  <Typography variant="body2" sx={{ fontStyle: 'italic' }}>
                    Henter grunnlag og svarer...
                  </Typography>
                </Box>
              ) : isQuestion ? (
                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap', fontSize: isMobile ? '0.9rem' : '1rem' }}>
                  {message.content}
                </Typography>
              ) : (
                <Box sx={{
                  '& p': { fontSize: isMobile ? '0.9rem' : '1rem', lineHeight: 1.5, margin: '0.5em 0' },
                  '& p:first-of-type': { marginTop: 0 },
                  '& p:last-child': { marginBottom: 0 },
                  '& h1, & h2, & h3, & h4, & h5, & h6': { margin: '1em 0 0.5em 0', fontSize: '1rem' },
                  '& ul, & ol': { paddingLeft: '1.5em', margin: '0.5em 0' },
                  '& li': { margin: '0.25em 0' },
                  '& code': { backgroundColor: 'rgba(0,0,0,0.06)', padding: '0.2em 0.4em', borderRadius: '3px', fontSize: '0.85em' },
                  '& pre': { backgroundColor: 'rgba(0,0,0,0.06)', padding: '1em', borderRadius: '4px', overflowX: 'auto' },
                  '& blockquote': { borderLeft: '3px solid', borderColor: 'divider', margin: '0.5em 0', paddingLeft: '0.75em' },
                  '& a': { color: 'primary.main' },
                  // A table is wider than a chat bubble more often than not, so it scrolls inside
                  // its own box rather than pushing the conversation sideways.
                  '& .md-table-wrap': { overflowX: 'auto', margin: '0.5em 0' },
                  '& table': { borderCollapse: 'collapse', fontSize: '0.85rem' },
                  '& th, & td': { border: '1px solid', borderColor: 'divider', padding: '0.3em 0.6em', textAlign: 'left' },
                  '& th': { backgroundColor: 'rgba(0,0,0,0.04)', fontWeight: 600 }
                }}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={{
                      table: ({ children }) => (
                        <Box className="md-table-wrap"><table>{children}</table></Box>
                      )
                    }}
                  >
                    {message.content}
                  </ReactMarkdown>
                </Box>
              )}
            </Paper>

            {!isQuestion && kind && (
              <Tooltip title={kind.help}>
                <Chip label={kind.label} size="small" color={kind.color} sx={{ mt: 0.5, height: 22, fontSize: '0.7rem' }} />
              </Tooltip>
            )}

            {!isQuestion && message.sources && message.sources.length > 0 && (
              <SourceChips sources={message.sources} />
            )}

            {/*
              Offered after the fact rather than as a mode the reader had to predict. Nothing in the
              database covered the question, and this is the point where they find that out.
            */}
            {!isQuestion && message.answerKind === 'NO_GROUNDING' && message.question && (
              <Button
                size="small"
                startIcon={<GeneralIcon sx={{ fontSize: 16 }} />}
                onClick={() => ask(message.question!, 'GENERAL')}
                disabled={loading}
                sx={{ mt: 0.5 }}
              >
                Spør modellen generelt
              </Button>
            )}

            <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
              <Chip
                label={formatTimestamp(message.timestamp)}
                size="small"
                variant="outlined"
                sx={{ height: 20, fontSize: '0.7rem', opacity: 0.7 }}
              />
              {/*
                Whether a provider was called at all, and which model answered. The response has
                carried this from the start; without showing it the only way to tell an answer read
                straight out of the database from one a model wrote was to read the backend log.
              */}
              {!isQuestion && message.modelUsed && (
                <Tooltip title={message.modelUsed === 'none'
                  ? 'Svart uten å kalle en modell: grunnlaget var tomt.'
                  : `Modell: ${message.modelUsed}`}>
                  <Chip
                    icon={message.modelUsed === 'none' ? undefined : <AiIcon sx={{ fontSize: 14 }} />}
                    label={message.modelUsed === 'none'
                      ? 'uten modellkall'
                      : `${message.modelUsed}${message.latencyMs != null ? ` • ${(message.latencyMs / 1000).toFixed(1)} s` : ''}`}
                    size="small"
                    variant="outlined"
                    sx={{ height: 20, fontSize: '0.7rem', opacity: 0.7 }}
                  />
                </Tooltip>
              )}
            </Stack>
          </Box>

          {isQuestion && (
            <Box sx={{ ml: 1, mt: 0.5 }}>
              <PersonIcon sx={{ color: 'primary.main', fontSize: 20 }} />
            </Box>
          )}
        </Box>
      </Fade>
    );
  };

  return (
    <Container sx={{ py: isMobile ? 2 : 4, display: 'flex', flexDirection: 'column' }} maxWidth="md">
      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 1.5 }}>
        <Typography variant={isMobile ? 'h6' : 'h5'}>Spør om konsulenter og avrop</Typography>
        <Button
          size="small"
          startIcon={<NewChatIcon />}
          onClick={onNewConversation}
          disabled={loading || messages.length === 0}
        >
          Ny samtale
        </Button>
      </Stack>

      {/*
        Positively framed and set to internal data, rather than a checkbox for turning something
        off. The two are different jobs, not one job with a feature disabled.
      */}
      <Stack direction="row" spacing={1.5} alignItems="center" sx={{ mb: 2 }} flexWrap="wrap" useFlexGap>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={scope}
          onChange={(_, next: ChatScope | null) => next && setScope(next)}
          aria-label="datagrunnlag"
        >
          <ToggleButton value="DATABASE" aria-label="Interne data">
            <DatabaseIcon sx={{ fontSize: 16, mr: 0.5 }} /> Interne data
          </ToggleButton>
          <ToggleButton value="GENERAL" aria-label="Generell AI">
            <GeneralIcon sx={{ fontSize: 16, mr: 0.5 }} /> Generell AI
          </ToggleButton>
        </ToggleButtonGroup>
        <Typography variant="caption" color="text.secondary">
          {scope === 'DATABASE'
            ? 'Svarene bygger på konsulenter, CV-er, avrop og matcheresultater.'
            : 'Generelt AI-svar – konsulent-, avrops- og matchedata brukes ikke.'}
        </Typography>
      </Stack>

      {clearFailed && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setClearFailed(false)}>
          Samtalen er tømt her, men serveren svarte ikke på slettingen. Turene kan fortsatt ligge
          der i opptil 24 timer.
        </Alert>
      )}

      <Paper elevation={1} sx={{ bgcolor: 'grey.50', minHeight: 280, mb: 2 }}>
        {messages.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1.5, p: 4 }}>
            <AiIcon sx={{ fontSize: 44, color: 'primary.main', opacity: 0.5 }} />
            <Typography variant="body1" color="text.secondary" textAlign="center">
              {scope === 'DATABASE'
                ? 'Svarene bygger på databasen, og kildene vises under hvert svar.'
                : 'Modellen svarer fra egen kunnskap. Ingen interne data hentes.'}
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" sx={{ maxWidth: 460 }}>
              {scope === 'DATABASE'
                ? 'Prøv «Hva kan Thomas Andersen best?», «Hvem kan Kotlin og Kafka?», «Hva krever Skatteetaten-avropet?» eller «Hvilke avrop har Thomas vært vurdert mot?».'
                : 'Prøv «Hva er Kafka?», «Forklar forskjellen på MÅ- og BØR-krav» eller «Hvordan bør et tilbud struktureres?».'}
            </Typography>
          </Box>
        ) : (
          <Box sx={{ p: 2, display: 'flex', flexDirection: 'column' }}>
            {messages.map(message => <MessageBubble key={message.id} message={message} />)}
            <div ref={bottomRef} />
          </Box>
        )}
      </Paper>

      {failedQuestion && (
        <Paper elevation={0} sx={{ p: 1.5, mb: 2, bgcolor: 'error.light' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Typography variant="body2">
              Spørsmålet feilet og er ikke lagt til samtalen: «{failedQuestion}»
            </Typography>
            <Button size="small" onClick={() => ask(failedQuestion)} disabled={loading}>
              Prøv igjen
            </Button>
          </Stack>
        </Paper>
      )}

      <Paper elevation={2} sx={{ p: 2 }}>
        <TextField
          label="Spørsmål"
          multiline
          minRows={isMobile ? 2 : 3}
          maxRows={isMobile ? 5 : 7}
          fullWidth
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={scope === 'DATABASE' ? 'F.eks: Hvem kan Kotlin og Kafka?' : 'F.eks: Hva er Kafka?'}
          disabled={loading}
        />
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 2 }} justifyContent="space-between">
          <Typography variant="caption" color="text.secondary">
            {content.length} tegn • Enter for å sende
            {scope === 'GENERAL' && ' • generell AI'}
            {conversationId && ' • fortsetter samtalen'}
          </Typography>
          <Button
            variant="contained"
            onClick={() => ask(content)}
            disabled={loading || !content.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : <SendIcon />}
            sx={{ minWidth: 100 }}
          >
            {loading ? 'Sender...' : 'Send'}
          </Button>
        </Stack>
      </Paper>
    </Container>
  );
};

export default ChatAnalyzePage;
