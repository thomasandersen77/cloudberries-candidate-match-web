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
import { describeCoverage, type RequirementCoverage } from './coverageText';
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
} from '../../types/api';
import { getEmbeddingInfo } from '../../services/consultantsService';
import {
  fromLegacyMatchStatus,
  fromProjectMatchStatus,
  phaseLabel,
  type FrontendMatchPhase,
} from '../../utils/matchStatusAdapter';
import { formatMatchScoreSuffix, formatPercentScore } from '../../utils/matchUtils';
import { getScoreColor } from '../../utils/scoreUtils';

const LIMIT_OPTIONS = [5, 10, 15] as const;
const CV_WEIGHT_OPTIONS = [20, 30, 50, 60, 80] as const;
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
  const canExpand = hasDetail || hasSkills;

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
            <Typography variant="body2">
              <b>{name}</b>
              {scoreLabel}
              {typeof qualityScore === 'number' && (
                <Box
                  component="span"
                  aria-label={`CV-kvalitet ${Math.round(qualityScore)} av 100`}
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
            </Stack>
          </Stack>
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
              {hasSkills && (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap sx={{ mt: hasDetail ? 1 : 0 }}>
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

type PanelState = {
  phase: FrontendMatchPhase;
  results: ProjectMatchResults | null;
  preview: ProjectMatchPreviewResponse | null;
  previewAvailable: boolean;
  semanticReady: boolean | null;
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
};

/**
 * One request, in the order the work happens: the requirements, then the candidates, then the AI.
 *
 * It used to open on two scales, a switch, four buttons and two disclaimers, with the numbers that
 * mattered (who covers what) nowhere. The preview is free, so it loads by itself; the settings
 * sit behind one button; and the only paid action, the AI run, is last with its one sentence.
 */
const RequestMatchPanel: React.FC<RequestMatchPanelProps> = ({ requestId, coverage }) => {
  const mountedRef = useRef(true);
  const [limit, setLimit] = useState<number>(10);
  const [cvWeightPercent, setCvWeightPercent] = useState<number>(30);
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
    preview: null,
    previewAvailable: true,
    semanticReady: null,
    error: null,
  });

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const refreshPersisted = useCallback(async () => {
    const [statusRes, resultsRes, embedInfo] = await Promise.all([
      getProjectMatchStatus(requestId).catch(() => ({ status: 'NOT_STARTED' } as MatchStatusDto)),
      getProjectMatchResults(requestId).catch(() => null),
      getEmbeddingInfo().catch(() => null),
    ]);
    if (!mountedRef.current) return;
    const hasResults = (resultsRes?.matches?.length ?? 0) > 0;
    setState((prev) => ({
      ...prev,
      phase: resolvePhase(statusRes, hasResults),
      results: resultsRes,
      semanticReady: embedInfo?.semanticSearchReady ?? embedInfo?.enabled ?? null,
      error: null,
    }));
  }, [requestId]);

  useEffect(() => {
    (async () => {
      setLoadingInitial(true);
      try {
        await refreshPersisted();
      } catch (error) {
        if (mountedRef.current) {
          setState((prev) => ({ ...prev, error: extractError(error, 'Kunne ikke laste matching-status.') }));
        }
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

  const handlePreview = useCallback(async () => {
    setLoadingPreview(true);
    setState((prev) => ({ ...prev, error: null }));
    try {
      const preview = await previewProjectMatches(requestId, { limit });
      if (!mountedRef.current) return;
      if (!preview) {
        setState((prev) => ({
          ...prev,
          preview: null,
          previewAvailable: false,
          phase: prev.phase === 'NOT_STARTED' ? 'READY_FOR_PREVIEW' : prev.phase,
        }));
        return;
      }
      // Everything previewed is ticked by default, so the button behaves as it always has until
      // someone deliberately narrows it.
      setSelectedUserIds(
        (preview.candidates ?? []).map((c) => c.userId).filter((id): id is string => Boolean(id)),
      );
      setState((prev) => ({
        ...prev,
        preview,
        previewAvailable: true,
        phase: 'PREVIEW_READY',
      }));
    } catch (error) {
      if (mountedRef.current) {
        setState((prev) => ({ ...prev, error: extractError(error, 'Forhåndsvisning feilet.') }));
      }
    } finally {
      if (mountedRef.current) setLoadingPreview(false);
    }
  }, [requestId, limit]);

  // The preview costs nothing (no model call), so it is there when the card opens, and follows
  // the limit. The AI run is the one thing that waits for a click.
  useEffect(() => {
    void handlePreview();
  }, [handlePreview]);

  const executeRun = async () => {
    setLoadingRun(true);
    setState((prev) => ({ ...prev, phase: 'RUNNING', error: null }));
    try {
      const outcome = await runProjectMatching(requestId, {
        limit,
        useHighestQualityModel: highQuality,
        cvWeightPercent,
        consultantUserIds: selectedUserIds,
      });
      if (!mountedRef.current) return;
      if ('async' in outcome && outcome.async) {
        // Poll persisted results briefly
        for (let i = 0; i < 20; i++) {
          await new Promise((r) => setTimeout(r, 1500));
          const results = await getProjectMatchResults(requestId);
          if (results?.matches?.length) {
            setState((prev) => ({ ...prev, results, phase: 'COMPLETED', preview: null }));
            return;
          }
        }
        setState((prev) => ({ ...prev, phase: 'RUNNING', error: 'Matching pågår fortsatt. Prøv å oppdatere siden om litt.' }));
        return;
      }
      const results = outcome as ProjectMatchResults;
      setState((prev) => ({
        ...prev,
        results,
        phase: 'COMPLETED',
        preview: null,
      }));
    } catch (error) {
      if (mountedRef.current) {
        setState((prev) => ({
          ...prev,
          phase: 'FAILED',
          error: extractError(error, 'AI-matching feilet.'),
        }));
      }
    } finally {
      if (mountedRef.current) setLoadingRun(false);
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

  return (
    <Stack spacing={2.5}>
      {state.error && <Alert severity="error">{state.error}</Alert>}

      {/* 1. What the customer asks for, and who in the corpus has it. */}
      <Box>
        <SectionTitle>Krav</SectionTitle>
        {coverage ? (
          <Stack spacing={0.75}>
            <Typography variant="body2" color="text.secondary">{describeCoverage(coverage)}</Typography>
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
              {previewCandidates.map((c) => {
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
      </Box>

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
          <Chip
            size="small"
            label={hasAiResults || state.phase === 'RUNNING' || state.phase === 'FAILED' ? phaseLabel(state.phase) : 'Ikke kjørt'}
            color={state.phase === 'COMPLETED' ? 'success' : state.phase === 'FAILED' ? 'error' : 'default'}
            variant="outlined"
          />
          {state.semanticReady === false && (
            <Chip size="small" color="warning" variant="outlined" label="Semantisk søk mangler embeddings" />
          )}
        </Stack>
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
          Ett modellkall per valgt kandidat, og ingenting før du trykker. Uten avkryssing sender backend de 15 best rangerte.
        </Typography>

        <Collapse in={settingsOpen} timeout="auto" unmountOnExit>
          <Stack id={`match-settings-${requestId}`} direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} flexWrap="wrap" useFlexGap sx={{ mt: 1.5 }}>
            <Stack spacing={0.25}>
              <Typography variant="caption" color="text.secondary">Antall kandidater</Typography>
              <ToggleButtonGroup size="small" exclusive value={limit} onChange={(_e, v) => { if (v != null) setLimit(v); }}>
                {LIMIT_OPTIONS.map((n) => (
                  <ToggleButton key={n} value={n} disabled={loadingRun || loadingPreview}>{n}</ToggleButton>
                ))}
              </ToggleButtonGroup>
            </Stack>
            <Stack spacing={0.25}>
              <Typography variant="caption" color="text.secondary">CV-kvalitet teller</Typography>
              <ToggleButtonGroup size="small" exclusive value={cvWeightPercent} onChange={(_e, v) => { if (v != null) setCvWeightPercent(v); }}>
                {CV_WEIGHT_OPTIONS.map((w) => (
                  <ToggleButton key={w} value={w} disabled={loadingRun}>{w}%</ToggleButton>
                ))}
              </ToggleButtonGroup>
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
              {aiMatches
                .slice()
                .sort((a: MatchCandidateDto, b: MatchCandidateDto) => (b.score ?? 0) - (a.score ?? 0))
                .slice(0, limit)
                .map((s: MatchCandidateDto) => {
                  const rowKey = `ai-${s.userId ?? s.name}`;
                  return (
                    <ExpandableConsultantRow
                      key={rowKey}
                      rowKey={rowKey}
                      name={s.name}
                      scoreLabel={formatMatchScoreSuffix(s.score)}
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
