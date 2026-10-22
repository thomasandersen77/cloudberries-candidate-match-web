import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  IconButton,
  Link as MuiLink,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { Link as RouterLink } from 'react-router-dom';
import { isAxiosError } from 'axios';
import HighQualityToggle from '../HighQualityToggle';
import { CoverageChips } from './RequestCoverage';
import { describeCoverage, describeFullMatch, type RequirementCoverage } from './coverageText';
import {
  getProjectMatchResults,
  getProjectMatchStatus,
  previewProjectMatches,
  runProjectMatching,
} from '../../api/matchingApi';
import type {
  MatchCandidateDto,
  MatchStatusDto,
  ProjectMatchPreviewResponse,
  ProjectMatchResults,
  ProjectMatchStatusResponse,
  RequirementScoreDto,
} from '../../types/api';
import { getEmbeddingInfo } from '../../services/consultantsService';
import {
  fromLegacyMatchStatus,
  fromProjectMatchStatus,
  phaseLabel,
  type FrontendMatchPhase,
} from '../../utils/matchStatusAdapter';
import { formatMatchScoreSuffix, formatPercentScore, formatQualityLabel } from '../../utils/matchUtils';
import { getScoreColor } from '../../utils/scoreUtils';

// How many the preselection hands to the model. Its order predicts the model's poorly (on 9011
// the model's second was fifteenth in the preselection), so the cut is wide: 20 by default, at
// about three cents a candidate. The preview shows the first five and opens on request.
const LIMIT_OPTIONS = [10, 20, 30] as const;
const DEFAULT_LIMIT = 20;
const PREVIEW_ROWS_CLOSED = 5;
// Decided 2026-10-20: quality tells the best apart, it does not replace the right experience.
// The backend's PresentedRanking uses the same percentage for the shortlist and the order.
const CV_WEIGHT_OPTIONS = [0, 10, 20, 30] as const;
const DEFAULT_CV_WEIGHT_PERCENT = 20;
const DETAIL_PREVIEW_LENGTH = 140;
/** How many of the requirements that cannot be checked against skills are spelled out before "+N". */
const OTHER_REQUIREMENTS_SHOWN = 4;

/** A heading over one of the panel's three parts: the requirements, the candidates, the AI. */
const SectionTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <Typography variant="overline" component="h3" sx={{ display: 'block', lineHeight: 1.6, color: 'text.secondary' }}>
    {children}
  </Typography>
);

function truncateDetail(text: string, maxLength = DETAIL_PREVIEW_LENGTH): string {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}…`;
}

type ExpandableConsultantRowProps = {
  rowKey: string;
  name: string;
  scoreLabel: string;
  /** CV quality 0-100. A weak CV is not worth submitting however well the skills match. */
  qualityScore?: number | null;
  /** After the score: what CV quality did to the place, e.g. « · CV 66 → 8,0». AI rows only. */
  qualityLabel?: string | null;
  /** Why the place differs from the match alone, in the backend's words. AI rows only. */
  qualityNote?: string | null;
  /** Somebody with a lower match is placed above on CV quality: a CV for a leader or seller to work on. */
  passedOnQuality?: boolean;
  /** The model's score per requirement, must-haves first; the context the one-line summary lacks. */
  requirements?: RequirementScoreDto[];
  detail?: string | null;
  skills?: string[];
  userId?: string | null;
  expandedKey: string | null;
  onToggle: (key: string) => void;
  /** Only the preview rows are selectable; the AI results are already scored. */
  selected?: boolean;
  onSelectedChange?: (selected: boolean) => void;
};

const ExpandableConsultantRow: React.FC<ExpandableConsultantRowProps> = ({
  rowKey,
  name,
  scoreLabel,
  qualityScore,
  qualityLabel,
  qualityNote,
  passedOnQuality,
  requirements,
  detail,
  skills,
  userId,
  expandedKey,
  onToggle,
  selected,
  onSelectedChange,
}) => {
  const isExpanded = expandedKey === rowKey;
  const hasDetail = Boolean(detail?.trim());
  const hasSkills = (skills?.length ?? 0) > 0;
  const hasRequirements = (requirements?.length ?? 0) > 0;
  const canExpand = hasDetail || hasSkills || hasRequirements;

  return (
    <Paper sx={{ p: 1 }}>
      <Stack direction="row" spacing={0.5} alignItems="flex-start">
        {onSelectedChange && (
          <Checkbox
            size="small"
            checked={Boolean(selected)}
            onChange={(e) => onSelectedChange(e.target.checked)}
            inputProps={{ 'aria-label': `Ta med ${name} i AI-vurderingen` }}
            sx={{ mt: -0.5 }}
          />
        )}
        {canExpand ? (
          <IconButton
            size="small"
            aria-label={isExpanded ? `Skjul detaljer for ${name}` : `Vis detaljer for ${name}`}
            aria-expanded={isExpanded}
            onClick={() => onToggle(rowKey)}
            sx={{ mt: -0.25 }}
          >
            {isExpanded ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
          </IconButton>
        ) : (
          <Box sx={{ width: 34, flexShrink: 0 }} />
        )}
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
            {/* A div, not a p: the «Passert» chip is a div, and a div inside a p is invalid HTML. */}
            <Typography variant="body2" component="div">
              <b>{name}</b>
              {scoreLabel}
              {qualityLabel}
              {passedOnQuality && (
                <Chip
                  label="Passert på CV-score"
                  size="small"
                  color="warning"
                  variant="outlined"
                  sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                />
              )}
              {typeof qualityScore === 'number' && (
                <Box
                  component="span"
                  aria-label={`CV-score ${Math.round(qualityScore)} av 100`}
                  sx={{
                    ml: 1,
                    px: 0.75,
                    py: 0.125,
                    borderRadius: 1,
                    fontSize: '0.75rem',
                    color: '#fff',
                    backgroundColor: getScoreColor(qualityScore),
                    whiteSpace: 'nowrap',
                  }}
                >
                  CV {Math.round(qualityScore)}
                </Box>
              )}
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
              {userId && (
                <MuiLink component={RouterLink} to={`/consultants/${userId}`} underline="hover">Se konsulent</MuiLink>
              )}
              {userId && (
                <MuiLink component={RouterLink} to={`/cv/${userId}`} underline="hover">Se CV</MuiLink>
              )}
              {userId && qualityNote && (
                <MuiLink component={RouterLink} to={`/cv-score/${userId}`} underline="hover">Se CV-score</MuiLink>
              )}
            </Stack>
          </Stack>
          {/* Said in words, from the numbers, so a leader sees whose CV to work on and why. */}
          {qualityNote && (
            <Typography variant="caption" color={passedOnQuality ? 'warning.main' : 'text.secondary'} sx={{ display: 'block', mt: 0.5 }}>
              {qualityNote}
            </Typography>
          )}
          {/* Closed, the first line only: for a preview row that is what they lack, for an AI row the start of the reasoning. */}
          {hasDetail && !isExpanded && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {truncateDetail(detail!.split('\n')[0])}
            </Typography>
          )}
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ mt: 0.75 }}>
              {hasDetail && (
                <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                  {detail}
                </Typography>
              )}
              {hasRequirements && (
                <Box sx={{ mt: hasDetail ? 1 : 0 }}>
                  <Typography variant="caption" color="text.secondary">Skår per krav, må-krav først</Typography>
                  <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: 0.25 }} aria-label="Skår per krav">
                    {[...requirements!].sort((a, b) => Number(b.isMustHave) - Number(a.isMustHave)).map((r) => (
                      <Chip
                        key={r.name}
                        size="small"
                        variant={r.isMustHave ? 'filled' : 'outlined'}
                        color={r.score >= 8 ? 'success' : r.score >= 5 ? 'default' : 'error'}
                        label={`${r.name} ${r.score.toFixed(1)}`}
                      />
                    ))}
                  </Stack>
                </Box>
              )}
              {hasSkills && (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: hasDetail || hasRequirements ? 1 : 0 }}>
                  {skills!.map((skill) => (
                    <Chip key={skill} label={skill} size="small" variant="outlined" />
                  ))}
                </Stack>
              )}
            </Box>
          </Collapse>
        </Box>
      </Stack>
    </Paper>
  );
};

/**
 * Four things that are true or false on their own: what the server says about the run, whether
 * the stored result could be read, what the free preview found, and what the last action said.
 *
 * They were one `phase`, and the preview wrote «Forhåndsvisning klar» over a completed run when
 * its answer arrived last, while a failed GET fell back to «ikke kjørt», so a server error read as
 * «nothing has been run» and invited a paid run. The run phase is written only by the status
 * endpoint and the run itself; a load failure keeps the last result and says so.
 */
type PanelState = {
  /** The run as the server last reported it, or as this panel started it. Never written by the preview. */
  phase: FrontendMatchPhase;
  results: ProjectMatchResults | null;
  /** The status or result could not be read; the result shown, if any, is the one read before. */
  loadError: string | null;
  preview: ProjectMatchPreviewResponse | null;
  previewAvailable: boolean;
  previewError: string | null;
  semanticReady: boolean | null;
  /** What the last action (a run) said went wrong. */
  error: string | null;
};

function extractError(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') return 'Tidsavbrudd hos backend. Prøv igjen.';
    return (error.response?.data as { message?: string } | undefined)?.message ?? error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

function resolvePhase(status: ProjectMatchStatusResponse | MatchStatusDto, hasResults: boolean): FrontendMatchPhase {
  if ('status' in status && status.status && !('phase' in status)) {
    const mapped = fromProjectMatchStatus(status as ProjectMatchStatusResponse);
    if (mapped === 'NOT_STARTED' && hasResults) return 'COMPLETED';
    return mapped;
  }
  const legacy = fromLegacyMatchStatus(status as MatchStatusDto);
  if (legacy === 'NOT_STARTED' && hasResults) return 'COMPLETED';
  return legacy;
}

export type RequestMatchPanelProps = {
  requestId: number;
  /** The request's requirement coverage, from the list; absent when the page could not load it. */
  coverage?: RequirementCoverage | null;
  /**
   * `card`: requirements, candidates, AI, as on the list page's card. `page`: the AI assessment
   * first and the candidates under it; the request page shows the requirements in its header,
   * and the assessment is the answer, so it comes before the estimate that chose who to assess.
   */
  layout?: 'card' | 'page';
};

/**
 * One request, in the order the work happens: the requirements, then the candidates, then the AI.
 *
 * It used to open on two scales, a switch, four buttons and two disclaimers, with the numbers that
 * mattered (who covers what) nowhere. The preview is free, so it loads by itself; the settings
 * sit behind one button; and the only paid action, the AI run, is last with its one sentence.
 */
const RequestMatchPanel: React.FC<RequestMatchPanelProps> = ({ requestId, coverage, layout = 'card' }) => {
  const mountedRef = useRef(true);
  const [limit, setLimit] = useState<number>(DEFAULT_LIMIT);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [cvWeightPercent, setCvWeightPercent] = useState<number>(DEFAULT_CV_WEIGHT_PERCENT);
  const [highQuality, setHighQuality] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingRun, setLoadingRun] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRun, setPendingRun] = useState<'run' | 'rerun' | null>(null);
  const [expandedRowKey, setExpandedRowKey] = useState<string | null>(null);
  /**
   * Who goes to the LLM. Empty means "let the backend preselect".
   *
   * Preselection is a recall filter, not a ranking: on the runs measured here its order and the
   * LLM's agreed almost not at all, and the LLM's top pick sat outside preselection's top ten. A
   * person who knows the customer picking from this list has better information than the score.
   */
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [state, setState] = useState<PanelState>({
    phase: 'NOT_STARTED',
    results: null,
    loadError: null,
    preview: null,
    previewAvailable: true,
    previewError: null,
    semanticReady: null,
    error: null,
  });
  /**
   * The request this panel shows now. An answer that arrives for another request, after the
   * panel moved on, is dropped: without this a slow result for one avrop landed on the next.
   */
  const activeRequestRef = useRef(requestId);
  activeRequestRef.current = requestId;
  const stillCurrent = (target: number) => mountedRef.current && activeRequestRef.current === target;

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    setState({
      phase: 'NOT_STARTED',
      results: null,
      loadError: null,
      preview: null,
      previewAvailable: true,
      previewError: null,
      semanticReady: null,
      error: null,
    });
  }, [requestId]);

  /** Reads only: the run status and the stored result. A failure here is said, never shown as «not run». */
  const refreshPersisted = useCallback(async () => {
    const target = requestId;
    const embedInfoPromise = getEmbeddingInfo().catch(() => null);
    try {
      const [statusRes, resultsRes] = await Promise.all([
        getProjectMatchStatus(target),
        getProjectMatchResults(target),
      ]);
      const embedInfo = await embedInfoPromise;
      if (!stillCurrent(target)) return;
      const hasResults = (resultsRes?.matches?.length ?? 0) > 0;
      setState((prev) => ({
        ...prev,
        phase: resolvePhase(statusRes, hasResults),
        results: resultsRes,
        loadError: null,
        semanticReady: embedInfo?.semanticSearchReady ?? embedInfo?.enabled ?? null,
      }));
    } catch (error) {
      if (!stillCurrent(target)) return;
      setState((prev) => ({ ...prev, loadError: extractError(error, 'Kunne ikke hente matching-status.') }));
    }
  }, [requestId]);

  useEffect(() => {
    (async () => {
      setLoadingInitial(true);
      try {
        await refreshPersisted();
      } finally {
        if (mountedRef.current) setLoadingInitial(false);
      }
    })();
  }, [refreshPersisted]);

  const previewUserIds = useMemo(
    () => (state.preview?.candidates ?? []).map((c) => c.userId).filter((id): id is string => Boolean(id)),
    [state.preview],
  );
  const selectedCount = selectedUserIds.length;
  const allPreviewSelected = previewUserIds.length > 0 && selectedCount === previewUserIds.length;

  const toggleCandidate = useCallback((userId: string, selected: boolean) => {
    setSelectedUserIds((prev) => (selected ? [...new Set([...prev, userId])] : prev.filter((id) => id !== userId)));
  }, []);

  const toggleAllCandidates = useCallback(
    (selected: boolean) => setSelectedUserIds(selected ? previewUserIds : []),
    [previewUserIds],
  );

  const toggleExpandedRow = useCallback((key: string) => {
    setExpandedRowKey((prev) => (prev === key ? null : key));
  }, []);

  useEffect(() => {
    setExpandedRowKey(null);
  }, [state.results, state.preview]);

  useEffect(() => {
    if (!state.preview) setSelectedUserIds([]);
  }, [state.preview]);

  // The preview writes the preview fields and nothing else: it is an estimate of whom to assess,
  // and says nothing about whether an assessment has been run.
  const handlePreview = useCallback(async () => {
    const target = requestId;
    setLoadingPreview(true);
    setState((prev) => ({ ...prev, previewError: null }));
    try {
      const preview = await previewProjectMatches(target, { limit });
      if (!stillCurrent(target)) return;
      if (!preview) {
        setState((prev) => ({ ...prev, preview: null, previewAvailable: false }));
        return;
      }
      // Everything previewed is ticked by default, so the button behaves as it always has until
      // someone deliberately narrows it.
      setSelectedUserIds(
        (preview.candidates ?? []).map((c) => c.userId).filter((id): id is string => Boolean(id)),
      );
      setState((prev) => ({ ...prev, preview, previewAvailable: true }));
    } catch (error) {
      if (stillCurrent(target)) {
        setState((prev) => ({ ...prev, previewError: extractError(error, 'Forhåndsvisning feilet.') }));
      }
    } finally {
      if (stillCurrent(target)) setLoadingPreview(false);
    }
  }, [requestId, limit]);

  // The preview costs nothing (no model call), so it is there when the card opens, and follows
  // the limit. The AI run is the one thing that waits for a click.
  useEffect(() => {
    void handlePreview();
  }, [handlePreview]);

  const executeRun = async () => {
    const target = requestId;
    setLoadingRun(true);
    setState((prev) => ({ ...prev, phase: 'RUNNING', error: null }));
    try {
      const outcome = await runProjectMatching(target, {
        limit,
        useHighestQualityModel: highQuality,
        cvWeightPercent,
        consultantUserIds: selectedUserIds,
      });
      if (!stillCurrent(target)) return;
      if ('async' in outcome && outcome.async) {
        // Poll persisted results briefly
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 1500));
          if (!stillCurrent(target)) return;
          const results = await getProjectMatchResults(target).catch(() => null);
          if (!stillCurrent(target)) return;
          if (results?.matches?.length) {
            setState((prev) => ({ ...prev, results, phase: 'COMPLETED' }));
            return;
          }
        }
        setState((prev) => ({ ...prev, phase: 'RUNNING', error: 'Matching pågår fortsatt. Prøv å oppdatere siden om litt.' }));
        return;
      }
      const results = outcome as ProjectMatchResults;
      // The candidates stay. Clearing them left an empty «Kandidater» under a card that said six
      // people covered every must, and no way back to the list short of closing the card.
      setState((prev) => ({
        ...prev,
        results,
        phase: 'COMPLETED',
      }));
    } catch (error) {
      if (stillCurrent(target)) {
        setState((prev) => ({
          ...prev,
          phase: 'FAILED',
          error: extractError(error, 'AI-matching feilet.'),
        }));
      }
    } finally {
      if (stillCurrent(target)) setLoadingRun(false);
      setConfirmOpen(false);
      setPendingRun(null);
    }
  };

  const requestRun = (mode: 'run' | 'rerun') => {
    if (highQuality) {
      setPendingRun(mode);
      setConfirmOpen(true);
      return;
    }
    void executeRun();
  };

  if (loadingInitial) {
    return (
      <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1 }}>
        <CircularProgress size={16} />
        <Typography variant="body2">Laster matching-status…</Typography>
      </Stack>
    );
  }

  const aiMatches = state.results?.matches ?? [];
  const hasAiResults = aiMatches.length > 0;
  const previewCandidates = state.preview?.candidates ?? [];
  const otherRequirements = coverage?.otherRequirements ?? [];

  const requirementsSection = (
    <>
          {/* 1. What the customer asks for, and who in the corpus has it. */}
          <Box>
            <SectionTitle>Krav</SectionTitle>
            {coverage ? (
              <Stack spacing={0.75}>
                <Typography variant="body2" color="text.secondary">{describeCoverage(coverage)}</Typography>
                {describeFullMatch(coverage) && <Typography variant="body2">{describeFullMatch(coverage)}</Typography>}
                <CoverageChips coverage={coverage} />
                {otherRequirements.length > 0 && (
                  <Typography variant="caption" color="text.secondary">
                    Sjekkes ikke mot ferdigheter: {otherRequirements.slice(0, OTHER_REQUIREMENTS_SHOWN).join('; ')}
                    {otherRequirements.length > OTHER_REQUIREMENTS_SHOWN && ` … og ${otherRequirements.length - OTHER_REQUIREMENTS_SHOWN} til`}
                  </Typography>
                )}
              </Stack>
            ) : (
              <Typography variant="body2" color="text.secondary">Kravene står i avropet.</Typography>
            )}
            <MuiLink component={RouterLink} to={`/project-requests/${requestId}`} underline="hover" variant="body2" sx={{ display: 'inline-block', mt: 0.75 }}>
              Se hele avropet
            </MuiLink>
          </Box>
    </>
  );

  const candidatesSection = (
    <>
          {/* 2. Who could be offered. Free, so already here; the operator picks who goes to the AI. */}
          <Box>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'baseline' }} justifyContent="space-between" sx={{ mb: 0.5 }}>
              <SectionTitle>Kandidater</SectionTitle>
              {previewCandidates.length > 0 && (
                <Stack direction="row" spacing={1} alignItems="center">
                  <Typography variant="caption" color="text.secondary">
                    {selectedCount} av {previewUserIds.length} valgt
                  </Typography>
                  <Button size="small" variant="text" disabled={loadingRun} onClick={() => toggleAllCandidates(!allPreviewSelected)}>
                    {allPreviewSelected ? 'Fjern alle' : 'Velg alle'}
                  </Button>
                </Stack>
              )}
            </Stack>

            {loadingPreview && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ py: 1 }}>
                <CircularProgress size={16} />
                <Typography variant="body2">Henter kandidater…</Typography>
              </Stack>
            )}

            {!loadingPreview && previewCandidates.length > 0 && (
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                  Sortert etter et grovt anslag uten AI. Hver rad sier hvilke må-krav personen dekker og mangler; kryss av dem du vil ha vurdert.
                  {state.preview?.semanticSearchUsed === false && ' Semantisk søk ble ikke brukt.'}
                </Typography>
                <Stack spacing={0.75}>
                  {(previewOpen ? previewCandidates : previewCandidates.slice(0, PREVIEW_ROWS_CLOSED)).map((c) => {
                    const rowKey = `preview-${c.userId ?? c.name}`;
                    const mustTotal = c.mustTotal ?? 0;
                    const missing = c.missingRequirements ?? [];
                    const detail = [
                      missing.length > 0 ? `Mangler: ${missing.join(', ')}` : (mustTotal > 0 ? 'Har noe for hvert teknologikrav.' : null),
                      c.reason,
                    ].filter(Boolean).join('\n');
                    return (
                      <ExpandableConsultantRow
                        key={rowKey}
                        rowKey={rowKey}
                        name={c.name ?? 'Ukjent'}
                        scoreLabel={
                          mustTotal > 0
                            ? ` • dekker ${c.mustCovered ?? 0} av ${mustTotal} må-krav`
                            : (typeof c.combinedScore === 'number' ? ` • rang ${formatPercentScore(c.combinedScore)}` : '')
                        }
                        qualityScore={typeof c.cvQualityScore === 'number' ? c.cvQualityScore * 100 : null}
                        detail={detail}
                        skills={c.matchedRequirements}
                        userId={c.userId}
                        expandedKey={expandedRowKey}
                        onToggle={toggleExpandedRow}
                        selected={c.userId ? selectedUserIds.includes(c.userId) : false}
                        onSelectedChange={c.userId ? (checked) => toggleCandidate(c.userId!, checked) : undefined}
                      />
                    );
                  })}
                </Stack>
                {previewCandidates.length > PREVIEW_ROWS_CLOSED && (
                  <Button size="small" variant="text" onClick={() => setPreviewOpen((o) => !o)} aria-expanded={previewOpen} sx={{ mt: 0.5, textTransform: 'none' }}>
                    {previewOpen ? 'Vis færre' : `Vis alle ${previewCandidates.length}`}
                  </Button>
                )}
              </Box>
            )}

            {!loadingPreview && state.preview && previewCandidates.length === 0 && (
              <Typography variant="body2" color="text.secondary">Ingen kandidater å vise for denne forespørselen.</Typography>
            )}

            {!state.previewAvailable && !state.preview && !loadingPreview && (
              <Alert severity="info" sx={{ py: 0.5 }}>
                Forhåndsvisning er ikke tilgjengelig fra backend. «Kjør AI-matching» lar backend velge kandidatene.
              </Alert>
            )}
            {state.previewError && (
              <Alert severity="warning" sx={{ py: 0.5 }}>Kunne ikke hente forhåndsvisningen: {state.previewError}</Alert>
            )}
          </Box>
    </>
  );

  const aiSection = (
    <>
          {/* 3. The paid step, last, with what it costs in one sentence and its settings behind a button. */}
          <Box>
            <SectionTitle>AI-vurdering</SectionTitle>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} flexWrap="wrap" useFlexGap sx={{ mb: 1 }}>
              <Button
                size="small"
                variant="contained"
                disabled={loadingRun || loadingPreview || (Boolean(state.preview) && selectedCount === 0)}
                onClick={() => requestRun('run')}
              >
                {loadingRun
                  ? 'Kjører…'
                  : selectedCount > 0
                    ? `Kjør AI-matching (${selectedCount})`
                    : 'Kjør AI-matching'}
              </Button>
              {hasAiResults && (
                <Button size="small" variant="outlined" color="secondary" disabled={loadingRun} onClick={() => requestRun('rerun')}>
                  Kjør på nytt
                </Button>
              )}
              <Button size="small" variant="text" disabled={loadingInitial} onClick={() => void refreshPersisted()}>
                Oppdater status
              </Button>
              <Button
                size="small"
                variant="text"
                aria-expanded={settingsOpen}
                aria-controls={`match-settings-${requestId}`}
                onClick={() => setSettingsOpen((v) => !v)}
              >
                {settingsOpen ? 'Skjul innstillinger' : 'Innstillinger'}
              </Button>
              {state.loadError ? (
                <Chip size="small" label="Status ukjent" color="warning" variant="outlined" />
              ) : (
                <Chip
                  size="small"
                  label={hasAiResults || state.phase === 'RUNNING' || state.phase === 'FAILED' ? phaseLabel(state.phase) : 'Ikke kjørt'}
                  color={state.phase === 'COMPLETED' ? 'success' : state.phase === 'FAILED' ? 'error' : 'default'}
                  variant="outlined"
                />
              )}
              {state.semanticReady === false && (
                <Chip size="small" color="warning" variant="outlined" label="Semantisk søk mangler embeddings" />
              )}
            </Stack>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
              Ett modellkall per valgt kandidat, og ingenting før du trykker. Uten avkryssing sender backend de 20 best rangerte.
            </Typography>

            <Collapse in={settingsOpen} timeout="auto" unmountOnExit>
              <Stack id={`match-settings-${requestId}`} direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
                <Stack spacing={0.25}>
                  <Typography variant="caption" color="text.secondary">Hvor mange vurderes</Typography>
                  <ToggleButtonGroup size="small" exclusive value={limit} onChange={(_e, v) => { if (v != null) setLimit(v); }}>
                    {LIMIT_OPTIONS.map((n) => (
                      <ToggleButton key={n} value={n} disabled={loadingRun || loadingPreview}>{n}</ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                </Stack>
                <Stack spacing={0.25}>
                  <Typography variant="caption" color="text.secondary">CV-score teller</Typography>
                  <ToggleButtonGroup size="small" exclusive value={cvWeightPercent} onChange={(_e, v) => { if (v != null) setCvWeightPercent(v); }}>
                    {CV_WEIGHT_OPTIONS.map((w) => (
                      <ToggleButton key={w} value={w} disabled={loadingRun}>{w}%</ToggleButton>
                    ))}
                  </ToggleButtonGroup>
                  {/* Said here because it is the one place the number is turned into a weight. */}
                  <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 420 }}>
                    CV-score måler hvor godt CV-en følger gull-CV-standarden, vurdert av en modell. Den sier ikke noe
                    om konsulentens kompetanse. Prosenten styrer rekkefølgen og kortlisten, ikke kravmatchen.
                  </Typography>
                </Stack>
                <HighQualityToggle checked={highQuality} onChange={setHighQuality} disabled={loadingRun} />
              </Stack>
            </Collapse>

            {state.phase === 'RUNNING' && loadingRun && (
              <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1.5 }}>
                <CircularProgress size={16} />
                <Typography variant="body2">
                  {selectedCount > 0
                    ? `Kjører AI-vurdering på ${selectedCount} valgte kandidater…`
                    : 'Kjører AI-vurdering på de best rangerte kandidatene…'}
                </Typography>
              </Stack>
            )}

            {hasAiResults && (
              <Box sx={{ mt: 1.5 }}>
                <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                  <Chip label={`${aiMatches.length} AI-vurdert`} size="small" color="primary" variant="outlined" />
                  {state.results?.lastUpdated && (
                    <Typography variant="caption" color="text.secondary">
                      Sist oppdatert: {new Date(state.results.lastUpdated).toLocaleString('no-NO')}
                    </Typography>
                  )}
                </Stack>
                <Stack spacing={0.75}>
                  {/* Every scored row, in the backend's order: the match weighed against CV score
                      (PresentedRanking). Sorting here again by the match alone would undo that and hide why
                      somebody is where they are; cutting to the limit hid reviews that were paid for. */}
                  {aiMatches
                    .map((s: MatchCandidateDto) => {
                      const rowKey = `ai-${s.userId ?? s.name}`;
                      return (
                        <ExpandableConsultantRow
                          key={rowKey}
                          rowKey={rowKey}
                          name={s.name}
                          scoreLabel={formatMatchScoreSuffix(s.score)}
                          qualityLabel={formatQualityLabel(s)}
                          qualityNote={s.qualityNote}
                          passedOnQuality={Boolean(s.passedOnQuality)}
                          requirements={s.requirements}
                          detail={s.justification}
                          skills={s.skills}
                          userId={s.userId}
                          expandedKey={expandedRowKey}
                          onToggle={toggleExpandedRow}
                        />
                      );
                    })}
                </Stack>
              </Box>
            )}
          </Box>
    </>
  );

  const sections = layout === 'page' ? [aiSection, candidatesSection] : [requirementsSection, candidatesSection, aiSection];

  return (
    <Stack spacing={2.5}>
      {state.loadError && (
        <Alert
          severity="warning"
          action={<Button size="small" color="inherit" onClick={() => void refreshPersisted()}>Hent på nytt</Button>}
        >
          Kunne ikke hente vurderingen: {state.loadError}
          {state.results ? ' Viser det som ble hentet sist.' : ' Om den er kjørt, er ukjent.'}
        </Alert>
      )}
      {state.error && <Alert severity="error">{state.error}</Alert>}

      {sections.map((section, i) => <React.Fragment key={i}>{section}</React.Fragment>)}

      <Dialog open={confirmOpen} onClose={() => { if (!loadingRun) { setConfirmOpen(false); setPendingRun(null); } }}>
        <DialogTitle>Bekreft høyeste kvalitet</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Dette kan bruke betydelig mer AI-kreditt. Vil du fortsette?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setConfirmOpen(false); setPendingRun(null); }} disabled={loadingRun}>Avbryt</Button>
          <Button variant="contained" onClick={() => void executeRun()} disabled={loadingRun}>
            {loadingRun ? 'Kjører…' : pendingRun === 'rerun' ? 'Kjør på nytt' : 'Kjør AI-matching'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
};

export default RequestMatchPanel;
