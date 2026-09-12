import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Container, Typography, TextField, Button, Paper, CircularProgress, Stack,
  Box, Fade, Chip, Tooltip, ToggleButton, ToggleButtonGroup, Alert,
  Checkbox, MenuItem, Select, FormControl, InputLabel, Snackbar, Collapse, IconButton,
  Table, TableHead, TableBody, TableRow, TableCell, Link as MuiLink,
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
  // Not a globe. A globe reads as web access, and this mode has none; the point of the label is to
  // set that expectation, not to undercut it with the icon next to it.
  AutoAwesome as GeneralIcon,
  ExpandMore as MoreIcon,
  Hub as MatchingIcon
} from '@mui/icons-material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { analyzeContent, clearAnalyzeConversation } from '../../services/chatService';
import { listProjectRequests } from '../../services/projectRequestsService';
import { listSkillSummary, listTopRankedConsultantsBySkill } from '../../services/skillsService';
import { searchConsultantsRelational } from '../../services/consultantsService';
import {
  databaseSuggestions, exampleConsultants, followUpSuggestions, placeableCustomer,
  GENERAL_SUGGESTIONS, PREFERRED_EXAMPLE_CONSULTANT,
  type PromptSuggestion, type SuggestionSubjects
} from './chatSuggestions';
import { runProjectMatching } from '../../api/matchingApi';
import { Link as RouterLink } from 'react-router-dom';
import ExpandIcon from '@mui/icons-material/UnfoldMore';
import CollapseIcon from '@mui/icons-material/UnfoldLess';
import type {
  CandidateComparison, ChatAnswerKind, ChatReading, ChatScope, ChatSource, RequestFit,
  RetrievalMethod
} from '../../types/api';

/**
 * What the reader picked out of an ambiguity, addressed the way the server pins it.
 *
 * The kind decides which field it goes in, because the two ids are different things: a request id
 * is a number of ours, a consultant id is a Flowcase user id.
 */
/** Shown before the reader has to ask for more. Six is a choice; eleven is a search page. */
const SUGGESTIONS_SHOWN = 6;

interface PickedAlternative {
  kind: 'PROJECT_REQUEST' | 'CONSULTANT';
  id: string;
}

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
  /** How many hits it was asked for, so "vis flere" knows what "flere" means. */
  topK?: number;
  /** Per-consultant scores when the turn ran a comparison. Empty on every other turn. */
  comparison?: CandidateComparison[];
  /** Per-request scores when the turn searched for the requests one consultant fits. */
  requestFit?: RequestFit[];
  /** Corrections, ties and misses in how the question was read. Empty on a clean turn. */
  readings?: ChatReading[];
  /**
   * The alternative already picked on this answer, if one was.
   *
   * A choice is answered once. While the buttons stayed live it was possible to pick Ostlandet,
   * read the answer, then pick Nord-Norge on the same question and get a second, contradictory
   * answer to it, at the cost of another model call.
   */
  pickedAlternativeId?: string;
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
    help: 'Modellens egen kunnskap, uten interne data og uten nettsøk.'
  }
};

const SOURCE_ICONS = {
  CONSULTANT: ConsultantIcon,
  PROJECT_REQUEST: DocumentIcon,
  STORED_MATCH: StoredMatchIcon
} as const;

// Matches the backend's cap. Each hit is a summary card in the prompt, so this is deliberately
// well below what a raw search endpoint would allow.
const MAX_TOP_K = 20;

// The backend's default too, and the value the select starts on.
const DEFAULT_TOP_K = 5;

const MESSAGES_KEY = 'chatAnalyzeMessages';
const CONVERSATION_KEY = 'chatAnalyzeConversationId';

const formatTimestamp = (date: Date) =>
  date.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });

/*
 * The message components live at module scope, not inside ChatAnalyzePage.
 *
 * Declared in the page's body they were rebuilt on every render, and a new function identity is a
 * different component type to React: the whole transcript was unmounted and mounted again on each
 * keystroke, Fade animations and all, which is what the flicker was. They take what they need as
 * props for the same reason.
 */
/**
 * What the question was read as, and what the reader can do about it.
 *
 * Rendered from the typed field, outside the answer bubble, because the correction is made by
 * the server and not by the model: prose the model writes is prose the model can reword, bury or
 * leave out, and a silent correction takes from the reader the one signal that something was
 * guessed. The reader's own words are never rewritten; the reading is shown beside them.
 *
 * An ambiguity is a choice, so it gets buttons carrying ids. A button that re-sent the wording
 * would only reach the same ambiguity again. A miss carries no buttons: the whole index is not a
 * list of near misses for a word that matched none of it.
 */
/**
 * The examples, as buttons that fill the field rather than a sentence listing them.
 *
 * Defined at module scope, like every other component on this page: one declared inside the page
 * component is a new type on every keystroke, and React remounts the whole subtree when the type
 * changes.
 */
const PromptSuggestions: React.FC<{
  suggestions: PromptSuggestion[];
  onPick: (text: string) => void;
}> = ({ suggestions, onPick }) => {
  const [showAll, setShowAll] = useState(false);
  const shown = showAll ? suggestions : suggestions.slice(0, SUGGESTIONS_SHOWN);

  return (
    <Stack spacing={1} alignItems="center" sx={{ width: '100%', maxWidth: 620 }}>
      <Stack direction="row" spacing={0.75} sx={{ flexWrap: 'wrap', gap: 0.75, justifyContent: 'center' }}>
        {shown.map(suggestion => (
          <Chip
            key={suggestion.text}
            label={suggestion.text}
            onClick={() => onPick(suggestion.text)}
            size="small"
            variant="outlined"
            color={suggestion.assessment ? 'warning' : 'default'}
            icon={suggestion.assessment ? <AiIcon sx={{ fontSize: 14 }} /> : undefined}
            sx={{ height: 'auto', py: 0.5, '& .MuiChip-label': { whiteSpace: 'normal' } }}
          />
        ))}
      </Stack>
      {suggestions.length > SUGGESTIONS_SHOWN && (
        <Button size="small" onClick={() => setShowAll(v => !v)} sx={{ textTransform: 'none' }}>
          {showAll ? 'Vis færre' : 'Vis flere eksempler'}
        </Button>
      )}
      {suggestions.some(s => s.assessment) && (
        <Typography variant="caption" color="text.secondary" textAlign="center">
          Merket med ikon: ny AI-vurdering. Den kjører ett modellkall per avrop og tar lengre tid.
        </Typography>
      )}
    </Stack>
  );
};

const ReadingNotices: React.FC<{
  readings: ChatReading[];
  question?: string;
  disabled: boolean;
  /** Set once this choice has been answered, so it cannot be answered a second time. */
  pickedId?: string;
  onPick: (reading: ChatReading, id: string) => void;
}> = ({ readings, question, disabled, pickedId, onPick }) => (
  <Stack spacing={0.5} sx={{ mt: 0.5 }}>
    {readings.map((reading, index) => {
      const label = reading.status === 'CORRECTED'
        ? `«${reading.written}» er lest som ${reading.readAs}`
        : reading.status === 'AMBIGUOUS'
          ? `«${reading.written}» passer flere`
          : `Fant ikke «${reading.written}»`;
      return (
        <Box key={`${reading.written}-${index}`}>
          <Tooltip
            title={reading.origin === 'MODEL_SUGGESTED'
              ? 'Tolket av en modell og deretter slått opp i basen'
              : reading.origin === 'DATABASE_FUZZY'
                ? 'Nærmeste treff i basen, ikke skrevet slik'
                : 'Slått opp direkte i basen'}
          >
            <Chip
              size="small"
              label={label}
              color={reading.status === 'CORRECTED' ? 'info' : 'warning'}
              variant={reading.origin === 'DATABASE_EXACT' ? 'filled' : 'outlined'}
              sx={{ height: 22, fontSize: '0.7rem' }}
            />
          </Tooltip>
          {reading.alternatives.length > 0 && question && (
            <Stack direction="row" spacing={0.5} sx={{ mt: 0.5, flexWrap: 'wrap', gap: 0.5 }}>
              {reading.alternatives.map(alternative => (
                <Button
                  key={alternative.id}
                  size="small"
                  variant={pickedId === alternative.id ? 'contained' : 'outlined'}
                  disabled={disabled || pickedId !== undefined}
                  onClick={() => onPick(reading, alternative.id)}
                  sx={{ textTransform: 'none' }}
                >
                  {alternative.label}
                </Button>
              ))}
            </Stack>
          )}
        </Box>
      );
    })}
  </Stack>
);

/**
 * A comparison as a table, from the typed field rather than parsed out of the prose.
 *
 * Every score here comes from the same screening prompt, schema and tier, which is what makes
 * the rows comparable at all. A candidate the run could not score shows no number: a failed call
 * is not a bad candidate, and a zero would rank it last on evidence nobody has.
 */
const ComparisonTable: React.FC<{ rows: CandidateComparison[] }> = ({ rows }) => (
  <Box sx={{ mt: 1, overflowX: 'auto' }}>
    <Table size="small" sx={{ minWidth: 380 }}>
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontWeight: 600 }}>Konsulent</TableCell>
          <TableCell sx={{ fontWeight: 600 }} align="right">Score</TableCell>
          <TableCell sx={{ fontWeight: 600 }} />
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map(row => (
          <TableRow key={row.ref} hover>
            <TableCell>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {row.ref} {row.name}
              </Typography>
            </TableCell>
            <TableCell align="right">
              {typeof row.score === 'number' ? (
                <Typography variant="body2">{row.score.toFixed(1)} / 10</Typography>
              ) : (
                <Tooltip title={row.notScoredReason ?? 'Ikke vurdert'}>
                  <Typography variant="body2" color="text.secondary">ikke vurdert</Typography>
                </Tooltip>
              )}
            </TableCell>
            <TableCell align="right">
              {row.consultantUserId && (
                <MuiLink
                  component={RouterLink}
                  to={`/consultants/${row.consultantUserId}`}
                  variant="caption"
                >
                  Se CV
                </MuiLink>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Box>
);

/**
 * The mirror of [ComparisonTable]: one consultant, one row per request screened.
 *
 * Same reason for being typed. The scores come from the same screening prompt and tier, so the
 * rows can be read against each other, and a request the run could not score shows no number
 * rather than a zero. Sorted by the server, so the order here is the order it decided.
 */
const RequestFitTable: React.FC<{ rows: RequestFit[] }> = ({ rows }) => (
  <Box sx={{ mt: 1, overflowX: 'auto' }}>
    <Table size="small" sx={{ minWidth: 380 }}>
      <TableHead>
        <TableRow>
          <TableCell sx={{ fontWeight: 600 }}>Avrop</TableCell>
          <TableCell sx={{ fontWeight: 600 }} align="right">Score</TableCell>
          <TableCell sx={{ fontWeight: 600 }} />
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map(row => (
          <TableRow key={row.ref} hover>
            <TableCell>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                {row.ref} {row.customerName}
              </Typography>
              {row.role && (
                <Typography variant="caption" color="text.secondary">{row.role}</Typography>
              )}
            </TableCell>
            <TableCell align="right">
              {typeof row.score === 'number' ? (
                <Typography variant="body2">{row.score.toFixed(1)} / 10</Typography>
              ) : (
                <Tooltip title={row.notScoredReason ?? 'Ikke vurdert'}>
                  <Typography variant="body2" color="text.secondary">ikke vurdert</Typography>
                </Tooltip>
              )}
            </TableCell>
            <TableCell align="right">
              {row.projectRequestId > 0 && (
                <MuiLink
                  component={RouterLink}
                  to={`/project-requests/${row.projectRequestId}`}
                  variant="caption"
                >
                  Se avrop
                </MuiLink>
              )}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Box>
);

/**
 * A search hit as a card rather than a chip.
 *
 * The answer text says the same in prose, but a reader wants to act on it: which criteria the CV
 * documents and for how long, which section the hit came from, and a way into the profile. None
 * of that should be read back out of a sentence.
 *
 * The similarity is shown as a similarity, never as a percentage match. Two unrelated CVs sit
 * around 0.80 with the current embedding model, so the number orders a list and says nothing on
 * its own.
 */
const ResultCards: React.FC<{
  sources: ChatSource[];
  selected: Record<string, string>;
  onToggleSelect: (userId: string, label: string) => void;
}> = ({ sources, selected, onToggleSelect }) => {
  const hits = sources.filter(s => s.kind === 'CONSULTANT' && s.retrieval);
  if (hits.length === 0) return null;

  const methodLabel: Record<RetrievalMethod, string> = {
    EXACT_SKILLS: 'Dokumenterte ferdigheter',
    SEMANTIC: 'Likhet i CV-tekst',
    HYBRID: 'Krav filtrert, likhet rangert'
  };

  return (
    <Stack spacing={1} sx={{ mt: 1, width: '100%' }}>
      {hits.map(hit => {
        const r = hit.retrieval!;
        return (
          <Paper key={hit.ref} variant="outlined" sx={{ p: 1.25 }}>
            <Stack direction="row" justifyContent="space-between" alignItems="flex-start" spacing={1}>
              <Stack direction="row" alignItems="center" spacing={0.5}>
                {hit.consultantUserId && (
                  <Checkbox
                    size="small"
                    sx={{ p: 0.25 }}
                    checked={hit.consultantUserId in selected}
                    onChange={() => onToggleSelect(hit.consultantUserId!, hit.label)}
                    inputProps={{ 'aria-label': `Velg ${hit.label}` }}
                  />
                )}
                <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                  {hit.ref} {hit.label}
                </Typography>
              </Stack>
              <Chip label={methodLabel[r.method]} size="small" variant="outlined" sx={{ fontSize: '0.65rem', height: 20 }} />
            </Stack>

            {r.documentedSkills && r.documentedSkills.length > 0 && (
              <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 0.5 }}>
                {/*
                  A missing duration is said, not left out. The database expresses "not recorded"
                  as NULL or as 0 on 17% of skill rows, and a bare name reads as "no years" as
                  readily as "none recorded". Only one of those is what the row means.
                */}
                Oppfyller: {r.documentedSkills.map(sk => `${sk.name} (${sk.years != null ? `${sk.years} år` : 'ukjent varighet'})`).join(', ')}
              </Typography>
            )}
            {r.bestChunkLabel && (
              <Typography variant="caption" color="text.secondary" display="block">
                Traff i CV-en: {r.bestChunkLabel}
              </Typography>
            )}
            <Stack direction="row" spacing={1.5} sx={{ mt: 0.5 }}>
              {r.cvQualityScore != null && (
                <Typography variant="caption" color="text.secondary">CV-kvalitet {r.cvQualityScore}</Typography>
              )}
              {r.semanticSimilarity != null && (
                <Tooltip title="Likhet i CV-teksten, ikke en matchprosent. To urelaterte CV-er ligger rundt 0,80.">
                  <Typography variant="caption" color="text.secondary">
                    Likhet {r.semanticSimilarity.toFixed(2)}
                  </Typography>
                </Tooltip>
              )}
              {hit.consultantUserId && (
                <Typography
                  component={RouterLink}
                  to={`/consultants/${hit.consultantUserId}`}
                  variant="caption"
                  sx={{ color: 'primary.main' }}
                >
                  Se CV
                </Typography>
              )}
            </Stack>
          </Paper>
        );
      })}
    </Stack>
  );
};

/**
 * The sources that are not already shown as result cards.
 *
 * A consultant hit appeared twice, once as a card and once as a chip with the same "K1 Kari
 * Nordmann" label. Chips are for the sources a card cannot express: a request, a stored
 * evaluation, a consultant read straight out of the database rather than found by a search.
 *
 * [alreadyShown] does the same for a comparison, whose rows carry no retrieval details and so
 * would otherwise appear both in the table and as chips underneath it.
 */
const SourceChips: React.FC<{ sources: ChatSource[]; alreadyShown?: Set<string> }> = ({
  sources, alreadyShown
}) => (
  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
    {sources.filter(s => !s.retrieval && !alreadyShown?.has(s.ref)).map(source => {
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

const MessageBubble: React.FC<{
  message: ChatMessage;
  isMobile: boolean;
  loading: boolean;
  selected: Record<string, string>;
  onToggleSelect: (userId: string, label: string) => void;
  onAsk: (question: string, askScope?: ChatScope, askTopK?: number, pinned?: PickedAlternative) => void;
  /** Puts a suggested question in the field. Never sends it; see PromptSuggestion. */
  onSuggest: (text: string) => void;
  /** Every customer this database has a request for, so a follow-up cannot name one it does not. */
  knownCustomers: string[];
  onPickAlternative: (messageId: string, alternativeId: string) => void;
}> = ({
  message, isMobile, loading, selected, onToggleSelect, onAsk, onSuggest, onPickAlternative,
  knownCustomers
}) => {
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
          maxWidth: isMobile ? '90%' : '85%',
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
                // max-content so the table keeps its natural width and the wrapper scrolls.
                // Without it the columns are squeezed to fit the bubble instead, and the bubble's
                // own break-word then splits the words inside them: a Status column rendered as
                // "OPE N" and a Krav column as "Kra v".
                '& table': { borderCollapse: 'collapse', fontSize: '0.85rem', width: 'max-content', maxWidth: 'none' },
                '& th, & td': {
                  border: '1px solid',
                  borderColor: 'divider',
                  padding: '0.3em 0.6em',
                  textAlign: 'left',
                  // The bubble breaks inside words so a long URL cannot push the layout sideways.
                  // A table cell has somewhere to overflow to, so it never needs to.
                  wordBreak: 'normal',
                  overflowWrap: 'normal'
                },
                '& th': { backgroundColor: 'rgba(0,0,0,0.04)', fontWeight: 600, whiteSpace: 'nowrap' }
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

          {!isQuestion && message.readings && message.readings.length > 0 && (
            <ReadingNotices
              readings={message.readings}
              question={message.question}
              disabled={loading}
              pickedId={message.pickedAlternativeId}
              onPick={(reading, id) => {
                // Only the two kinds the server can be told to pin. A match result has no pin,
                // and a button that sent one would come back to the same ambiguity.
                if (reading.kind !== 'PROJECT_REQUEST' && reading.kind !== 'CONSULTANT') return;
                if (!message.question) return;
                onPickAlternative(message.id, id);
                onAsk(message.question, 'DATABASE', message.topK ?? DEFAULT_TOP_K, {
                  kind: reading.kind,
                  id
                });
              }}
            />
          )}

          {!isQuestion && message.comparison && message.comparison.length > 0 && (
            <ComparisonTable rows={message.comparison} />
          )}

          {!isQuestion && message.requestFit && message.requestFit.length > 0 && (
            <RequestFitTable rows={message.requestFit} />
          )}

          {!isQuestion && message.sources && message.sources.length > 0 && (
            <>
              <ResultCards
                sources={message.sources}
                selected={selected}
                onToggleSelect={onToggleSelect}
              />
              {/*
                A bigger retrieval, not a page of a cached one: asking for more is a new search
                with a wider limit, and the model narrates the wider set so it can cite it.
              */}
              {message.answerKind === 'SEARCH_RESULT' && message.question &&
                (message.topK ?? DEFAULT_TOP_K) < MAX_TOP_K &&
                message.sources.filter(s => s.retrieval).length >= (message.topK ?? DEFAULT_TOP_K) && (
                <Button
                  size="small"
                  startIcon={<MoreIcon sx={{ fontSize: 16 }} />}
                  onClick={() => onAsk(message.question!, 'DATABASE', Math.min((message.topK ?? DEFAULT_TOP_K) * 2, MAX_TOP_K))}
                  disabled={loading}
                  sx={{ mt: 0.5 }}
                >
                  Vis flere
                </Button>
              )}
              <SourceChips
                sources={message.sources}
                alreadyShown={new Set([
                  ...(message.comparison?.map(c => c.ref) ?? []),
                  ...(message.requestFit?.map(f => f.ref) ?? [])
                ])}
              />
            </>
          )}

          {/*
            Offered after the fact rather than as a mode the reader had to predict. Nothing in the
            database covered the question, and this is the point where they find that out.
          */}
          {!isQuestion && message.answerKind === 'NO_GROUNDING' && message.question && (
            <Button
              size="small"
              startIcon={<GeneralIcon sx={{ fontSize: 16 }} />}
              onClick={() => onAsk(message.question!, 'GENERAL')}
              disabled={loading}
              sx={{ mt: 0.5 }}
            >
              Spør modellen generelt
            </Button>
          )}

          {/*
            Where a reader usually goes next, read off the answer's kind and its typed sources
            rather than its prose. Like the examples, these fill the field instead of sending: the
            tempting ones are the assessments, and those are the ones that cost.
          */}
          {!isQuestion && !message.loading && (() => {
            const followUps = followUpSuggestions(
              message.answerKind, message.sources, message.question, knownCustomers
            );
            return followUps.length > 0 && (
              <Stack direction="row" spacing={0.5} sx={{ mt: 1, flexWrap: 'wrap', gap: 0.5 }}>
                {followUps.map(suggestion => (
                  <Chip
                    key={suggestion.text}
                    label={suggestion.text}
                    onClick={() => onSuggest(suggestion.text)}
                    size="small"
                    variant="outlined"
                    color={suggestion.assessment ? 'warning' : 'default'}
                    icon={suggestion.assessment ? <AiIcon sx={{ fontSize: 14 }} /> : undefined}
                    disabled={loading}
                    sx={{ height: 'auto', py: 0.4, '& .MuiChip-label': { whiteSpace: 'normal' } }}
                  />
                ))}
              </Stack>
            );
          })()}

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

const ChatAnalyzePage: React.FC = () => {
  const [content, setContent] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [failedQuestion, setFailedQuestion] = useState<string | null>(null);
  const [failureHint, setFailureHint] = useState<string | null>(null);
  const [scope, setScope] = useState<ChatScope>('DATABASE');
  const [clearFailed, setClearFailed] = useState(false);
  // The key for the attempt in flight. A retry reuses it, so a question the server already answered
  // before the response was lost comes back from the server instead of being asked again.
  const pendingTurnId = useRef<string | null>(null);
  const [topK, setTopK] = useState(DEFAULT_TOP_K);
  const [selected, setSelected] = useState<Record<string, string>>({});
  const [requests, setRequests] = useState<Array<{ id: number; label: string }>>([]);
  /** Rows the examples are built from. Empty until they load, and empty is a shorter list. */
  const [subjects, setSubjects] = useState<SuggestionSubjects>({});
  /** The examples, reopened after the conversation has started. */
  const [examplesOpen, setExamplesOpen] = useState(false);
  /** The detail under the grounding note. Open to begin with, because the first turn is the one
   * where somebody is working out what this thing answers from. */
  const [groundingNoteOpen, setGroundingNoteOpen] = useState(true);
  const [targetRequestId, setTargetRequestId] = useState<number | ''>('');
  const [matchingBusy, setMatchingBusy] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  /** So a picked example lands in a focused field, ready to edit or send. */
  const questionFieldRef = useRef<HTMLTextAreaElement | null>(null);

  /**
   * A suggestion goes in the field and stops there, whether it came from the examples or from
   * under an answer. One rule rather than two: several of these start a run of paid screenings,
   * and which ones should not be something the reader has to remember.
   */
  const suggest = useCallback((text: string) => {
    setContent(text);
    setExamplesOpen(false);
    // After the commit, not during it. Focusing while React is still rendering loses the caret to
    // whatever the browser focuses when the click finishes.
    requestAnimationFrame(() => questionFieldRef.current?.focus());
  }, []);
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

  // The picker for "send til matching". Loaded once; three rows today, and a select is honest at
  // that size.
  useEffect(() => {
    listProjectRequests()
      .then(list => {
        setRequests(list.map(r => ({
          id: Number(r.id),
          label: [r.customerName, r.title].filter(Boolean).join(' — ').slice(0, 70)
        })).filter(r => Number.isFinite(r.id)));
        // The same rows the picker uses, so the examples cost no extra request.
        const customers = list.map(r => r.customerName ?? '').filter(Boolean);
        setSubjects(prev => ({ ...prev, customers, customer: placeableCustomer(customers) }));
      })
      .catch(() => setRequests([]));
  }, []);

  // The names and technologies the examples are written around. Two small reads, both optional:
  // a failure leaves the list shorter rather than putting a consultant who is not here in front of
  // the reader. Nothing here calls a model.
  useEffect(() => {
    // Not the most documented technologies. GIT and SQL lead with 70 and 65 of 105 consultants,
    // and "Hvem kan GIT og SQL?" returns most of the company, which teaches nothing about what the
    // search is for. The first two at or below half the leader's count are still well documented
    // and actually separate people: here REACT and KUBERNETES, at 35 and 32.
    listSkillSummary({ page: 0, size: 40, sort: 'consultantCount,desc' })
      .then(page => {
        const ranked = (page.content ?? []).filter(s => s.name);
        const ceiling = (ranked[0]?.consultantCount ?? 0) / 2;
        const discriminating = ranked.filter(s => (s.consultantCount ?? 0) <= ceiling);
        const skills = (discriminating.length > 0 ? discriminating : ranked).slice(0, 2).map(s => s.name);
        // The whole page of names, so a named example can be checked against what this database
        // documents before it is offered. Free: it is the page already fetched.
        setSubjects(prev => ({ ...prev, skills, catalogue: ranked.map(s => s.name) }));
        if (!skills[0]) return;

        // The rest of the names are the ones ranked on that first technology, with an active CV.
        // Taking any three consultants put the managing director in an example asking which
        // requests he fits, and produced a comparison that could score one of the three it named,
        // because the other two have no CV to score.
        return Promise.all([
          listTopRankedConsultantsBySkill(skills[0], 3)
            .then(ranked => ranked.map(c => c.name).filter((n): n is string => !!n))
            .catch(() => []),
          // Looked up rather than assumed: the name only goes in an example if this database has
          // it. See PREFERRED_EXAMPLE_CONSULTANT for why there is a preferred one at all.
          searchConsultantsRelational({
            request: { name: PREFERRED_EXAMPLE_CONSULTANT, onlyActiveCv: true },
            page: 0,
            size: 1
          })
            .then(page => page.content?.[0]?.name)
            .catch(() => undefined)
        ]).then(([ranked, preferred]) => setSubjects(prev => ({
          ...prev,
          consultants: exampleConsultants(preferred, ranked)
        })));
      })
      .catch(() => { /* the examples that need a name are left out */ });
  }, []);

  // Newest last, so the conversation reads top to bottom like every other chat. Optional call
  // because scrollIntoView is not universal: jsdom has no implementation, and a missing browser
  // API should not take the page down with it.
  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'end' });
  }, [messages]);

  const ask = useCallback(async (
    question: string,
    askScope: ChatScope = scope,
    askTopK: number = topK,
    /**
     * Something the reader picked from the alternatives on an earlier answer.
     *
     * Sent as an id rather than as text. Re-sending the wording that was ambiguous would only
     * reach the same ambiguity again, and the reader would be asked the same question twice. The
     * question itself is the one that was interrupted, so answering the choice answers it.
     */
    pinned?: PickedAlternative
  ) => {
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
    setFailureHint(null);
    setLoading(true);

    try {
      const turnId = pendingTurnId.current ?? crypto.randomUUID();
      pendingTurnId.current = turnId;

      const res = await analyzeContent({
        content: question.trim(),
        scope: askScope,
        topK: askTopK,
        turnId,
        ...(pinned?.kind === 'PROJECT_REQUEST' ? { pinnedRequestId: Number(pinned.id) } : {}),
        ...(pinned?.kind === 'CONSULTANT' ? { pinnedConsultantUserId: pinned.id } : {}),
        ...(conversationId ? { conversationId } : {})
      });
      pendingTurnId.current = null;

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
        question: question.trim(),
        topK: askTopK,
        comparison: res.comparison,
        requestFit: res.requestFit,
        readings: res.readings
      } : msg));
    } catch (err) {
      // Both bubbles go: the turn never reached the conversation, so leaving a question in the
      // transcript with no answer under it misrepresents what the conversation contains. The text
      // is kept in the retry banner instead, so nothing has to be retyped.
      //
      // The status matters to whoever has to act on it. A dev proxy pointing at a stopped backend
      // answers 500 with an empty body, which is indistinguishable from an application error
      // unless the message says which one is more likely.
      const status = (err as { response?: { status?: number } })?.response?.status;
      setFailureHint(
        status === undefined
          ? 'Ingen svar fra serveren. Er backend startet?'
          : status >= 500
            ? `Serveren svarte ${status}. Det kan være at backend ikke kjører, eller en feil på serversiden.`
            : `Serveren svarte ${status}.`
      );
      setFailedQuestion(question.trim());
      setMessages(prev => prev.filter(msg => msg.id !== answerId && msg.id !== questionId));
    } finally {
      setLoading(false);
    }
  }, [conversationId, loading, scope, topK]);

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

  const toggleSelected = useCallback((userId: string, name: string) => {
    setSelected(prev => {
      const next = { ...prev };
      if (userId in next) delete next[userId]; else next[userId] = name;
      return next;
    });
  }, []);

  /**
   * Hands the chosen consultants to the matching pipeline rather than scoring them here.
   *
   * The run endpoint takes an explicit list and skips preselection for it, which is the point:
   * preselection is a recall filter whose order correlates almost not at all with the model's, so
   * an operator who has picked people should get those people evaluated.
   */
  const sendToMatching = useCallback(async () => {
    const ids = Object.keys(selected);
    if (ids.length === 0 || targetRequestId === '') return;
    setMatchingBusy(true);
    try {
      await runProjectMatching(Number(targetRequestId), { consultantUserIds: ids });
      setToast(`Matchekjøring startet for ${ids.length} konsulenter på avrop ${targetRequestId}.`);
      setSelected({});
    } catch {
      setToast('Kunne ikke starte matchekjøringen. Ingenting er endret.');
    } finally {
      setMatchingBusy(false);
    }
  }, [selected, targetRequestId]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      ask(content);
    }
  }, [ask, content]);


  return (
    <Container sx={{ py: isMobile ? 2 : 4, display: 'flex', flexDirection: 'column' }} maxWidth="lg">
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
        {scope === 'DATABASE' && (
          <FormControl size="small" sx={{ minWidth: 96 }}>
            <InputLabel id="topk-label">Treff</InputLabel>
            <Select
              labelId="topk-label"
              label="Treff"
              value={topK}
              onChange={(e) => setTopK(Number(e.target.value))}
            >
              {[5, 10, 20].map(n => <MenuItem key={n} value={n}>{n}</MenuItem>)}
            </Select>
          </FormControl>
        )}
        <Typography variant="caption" color="text.secondary">
          {scope === 'DATABASE'
            ? 'Svarene bygger på konsulenter, CV-er, avrop og matcheresultater.'
            : 'Modellkunnskap – uten interne data og uten nettsøk.'}
        </Typography>
      </Stack>

      {/* Appears only once someone has picked people, so it is out of the way until it is useful. */}
      {Object.keys(selected).length > 0 && (
        <Paper variant="outlined" sx={{ p: 1.5, mb: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
            <Typography variant="body2" sx={{ flex: 1 }}>
              {Object.keys(selected).length} valgt: {Object.values(selected).join(', ')}
            </Typography>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel id="target-request-label">Avrop</InputLabel>
              <Select
                labelId="target-request-label"
                label="Avrop"
                value={targetRequestId}
                onChange={(e) => setTargetRequestId(e.target.value === '' ? '' : Number(e.target.value))}
              >
                {requests.map(r => <MenuItem key={r.id} value={r.id}>{r.id}: {r.label}</MenuItem>)}
              </Select>
            </FormControl>
            <Button
              variant="contained"
              size="small"
              startIcon={matchingBusy ? <CircularProgress size={14} /> : <MatchingIcon sx={{ fontSize: 16 }} />}
              onClick={sendToMatching}
              disabled={matchingBusy || targetRequestId === ''}
            >
              Kjør matching
            </Button>
            <Button size="small" onClick={() => setSelected({})} disabled={matchingBusy}>
              Nullstill
            </Button>
          </Stack>
        </Paper>
      )}

      <Snackbar
        open={toast !== null}
        autoHideDuration={6000}
        onClose={() => setToast(null)}
        message={toast ?? ''}
      />

      {clearFailed && (
        <Alert severity="warning" sx={{ mb: 2 }} onClose={() => setClearFailed(false)}>
          Samtalen er tømt her, men serveren svarte ikke på slettingen. Turene kan fortsatt ligge
          der i opptil 24 timer.
        </Alert>
      )}

      <Paper elevation={1} sx={{ bgcolor: 'grey.50', minHeight: 280, mb: 2 }}>
        {/*
          Where the answers come from, said once and then kept. It used to live in the empty state,
          so the sentence explaining that the answers are grounded in the database disappeared the
          moment somebody asked something, which is the moment it starts mattering. It folds to its
          own header instead, from the button in the corner.
        */}
        <Box sx={{ px: 2, pt: 1.5, pb: groundingNoteOpen ? 1.5 : 1 }}>
          <Stack direction="row" alignItems="flex-start" spacing={1}>
            <AiIcon sx={{ fontSize: 20, color: 'primary.main', opacity: 0.6, mt: 0.25 }} />
            <Typography variant="body2" color="text.secondary" sx={{ flex: 1 }}>
              {scope === 'DATABASE'
                ? 'Svarene bygger på databasen, og kildene vises under hvert svar.'
                : 'Modellen svarer fra egen kunnskap. Ingen interne data hentes.'}
            </Typography>
            <Tooltip title={groundingNoteOpen ? 'Minimer' : 'Vis mer'}>
              <IconButton
                size="small"
                onClick={() => setGroundingNoteOpen(open => !open)}
                aria-label={groundingNoteOpen ? 'Minimer forklaringen' : 'Vis forklaringen'}
                aria-expanded={groundingNoteOpen}
                sx={{ mt: -0.5 }}
              >
                {groundingNoteOpen ? <CollapseIcon fontSize="small" /> : <ExpandIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          </Stack>
          <Collapse in={groundingNoteOpen}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, pl: 3.5 }}>
              {scope === 'DATABASE'
                ? 'Et svar siterer det det bygger på, som K1 for en konsulent og A1 for et avrop. Står noe ikke i grunnlaget, sier assistenten det i stedet for å gjette.'
                : 'Ingenting fra konsulentbasen eller avropene sendes med, og svaret kan ikke siteres tilbake til en kilde her.'}
            </Typography>
          </Collapse>
        </Box>

        {messages.length === 0 ? (
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 1.5, px: 4, pb: 4, pt: 1 }}>
            <PromptSuggestions
              suggestions={scope === 'DATABASE' ? databaseSuggestions(subjects) : GENERAL_SUGGESTIONS}
              onPick={suggest}
            />
          </Box>
        ) : (
          <Box sx={{ px: 2, pb: 2, display: 'flex', flexDirection: 'column' }}>
            {messages.map(message => (
              <MessageBubble
                key={message.id}
                message={message}
                isMobile={isMobile}
                loading={loading}
                selected={selected}
                onToggleSelect={toggleSelected}
                onAsk={ask}
                onSuggest={suggest}
                knownCustomers={subjects.customers ?? []}
                onPickAlternative={(messageId, alternativeId) => setMessages(prev => prev.map(m =>
                  m.id === messageId ? { ...m, pickedAlternativeId: alternativeId } : m))}
              />
            ))}
            <div ref={bottomRef} />
          </Box>
        )}
      </Paper>

      {failedQuestion && (
        <Paper elevation={0} sx={{ p: 1.5, mb: 2, bgcolor: 'error.light' }}>
          <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
            <Box>
              <Typography variant="body2">
                Spørsmålet feilet og er ikke lagt til samtalen: «{failedQuestion}»
              </Typography>
              {failureHint && (
                <Typography variant="caption" display="block">{failureHint}</Typography>
              )}
            </Box>
            <Button size="small" onClick={() => ask(failedQuestion)} disabled={loading}>
              Prøv igjen
            </Button>
          </Stack>
        </Paper>
      )}

      <Paper elevation={2} sx={{ p: 2 }}>
        {/*
          The examples used to live in the empty state and nowhere else, so after the first answer
          there was nothing left on screen saying what else the assistant could be asked. They stay
          reachable here instead, folded away rather than gone.
        */}
        {messages.length > 0 && (
          <Box sx={{ mb: examplesOpen ? 1.5 : 1 }}>
            <Button
              size="small"
              startIcon={<AiIcon sx={{ fontSize: 16 }} />}
              onClick={() => setExamplesOpen(open => !open)}
              sx={{ textTransform: 'none' }}
            >
              {examplesOpen ? 'Skjul eksempler' : 'Eksempler'}
            </Button>
            {/*
              unmountOnExit, so the folded examples are not in the page while they are invisible.
              A Collapse keeps its children mounted by default, which left every example reachable
              to a screen reader, and to anything else reading the page, as a second copy of text
              that also appears under the answers.
            */}
            <Collapse in={examplesOpen} unmountOnExit>
              <Box sx={{ mt: 1 }}>
                <PromptSuggestions
                  suggestions={scope === 'DATABASE' ? databaseSuggestions(subjects) : GENERAL_SUGGESTIONS}
                  onPick={suggest}
                />
              </Box>
            </Collapse>
          </Box>
        )}
        <TextField
          label="Spørsmål"
          inputRef={questionFieldRef}
          multiline
          minRows={isMobile ? 2 : 3}
          maxRows={isMobile ? 5 : 7}
          fullWidth
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={scope === 'DATABASE'
            ? 'Søk etter kompetanse, spør om en konsulent eller vurder et avrop …'
            : 'F.eks: Hva er Kafka?'}
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
