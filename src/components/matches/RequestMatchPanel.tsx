import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Link as MuiLink,
  Paper,
  Stack,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { isAxiosError } from 'axios';
import HighQualityToggle from '../HighQualityToggle';
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

const LIMIT_OPTIONS = [5, 10, 15] as const;
const CV_WEIGHT_OPTIONS = [20, 30, 50, 60, 80] as const;

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
  hitCount?: number | null;
};

const RequestMatchPanel: React.FC<RequestMatchPanelProps> = ({ requestId, hitCount }) => {
  const mountedRef = useRef(true);
  const [limit, setLimit] = useState<number>(10);
  const [cvWeightPercent, setCvWeightPercent] = useState<number>(30);
  const [highQuality, setHighQuality] = useState(false);
  const [loadingInitial, setLoadingInitial] = useState(true);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [loadingRun, setLoadingRun] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [pendingRun, setPendingRun] = useState<'run' | 'rerun' | null>(null);
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

  const handlePreview = async () => {
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
  };

  const executeRun = async () => {
    setLoadingRun(true);
    setState((prev) => ({ ...prev, phase: 'RUNNING', error: null }));
    try {
      const outcome = await runProjectMatching(requestId, {
        limit,
        useHighestQualityModel: highQuality,
        cvWeightPercent,
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

  const renderConsultant = (s: MatchCandidateDto, key: string) => (
    <Paper key={key} sx={{ p: 1 }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
        <Typography variant="body2">
          <b>{s.name}</b>
          {typeof s.score === 'number' ? ` • score ${s.score.toFixed(1)}` : ''}
        </Typography>
        <Stack direction="row" spacing={1}>
          {s.userId && (
            <MuiLink component={RouterLink} to={`/consultants/${s.userId}`} underline="hover">Se konsulent</MuiLink>
          )}
          {s.userId && (
            <MuiLink component={RouterLink} to={`/cv/${s.userId}`} underline="hover">Se CV</MuiLink>
          )}
        </Stack>
      </Stack>
      {s.justification && (
        <Tooltip title={s.justification} placement="bottom-start">
          <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }} color="text.secondary">
            {s.justification.length > 140 ? `${s.justification.slice(0, 140)}…` : s.justification}
          </Typography>
        </Tooltip>
      )}
    </Paper>
  );

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

  return (
    <Stack spacing={1.5}>
      <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap alignItems="center">
        <Chip size="small" label={phaseLabel(state.phase)} color={state.phase === 'COMPLETED' ? 'success' : state.phase === 'FAILED' ? 'error' : 'default'} />
        {typeof hitCount === 'number' && (
          <Chip size="small" variant="outlined" label={`Dekning: ${hitCount} treff`} />
        )}
        {state.semanticReady === true && (
          <Chip size="small" color="info" variant="outlined" label="Semantisk søk er klart" />
        )}
        {state.semanticReady === false && (
          <Chip size="small" color="warning" variant="outlined" label="Semantisk søk mangler embeddings" />
        )}
        {state.results?.lastUpdated && (
          <Typography variant="caption" color="text.secondary">
            Sist oppdatert: {new Date(state.results.lastUpdated).toLocaleString('no-NO')}
          </Typography>
        )}
      </Stack>

      {state.error && <Alert severity="error">{state.error}</Alert>}

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} flexWrap="wrap" useFlexGap>
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

      <Typography variant="caption" color="text.secondary">
        Forhåndsvisning bruker billig rangering uten full AI-vurdering. Kjør AI-matching for full vurdering.
      </Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
        <Button size="small" variant="outlined" disabled={loadingPreview || loadingRun} onClick={() => void handlePreview()}>
          {loadingPreview ? 'Laster…' : 'Forhåndsvis kandidater'}
        </Button>
        <Button size="small" variant="contained" disabled={loadingRun || loadingPreview} onClick={() => requestRun('run')}>
          {loadingRun ? 'Kjører…' : 'Kjør AI-matching'}
        </Button>
        {hasAiResults && (
          <Button size="small" variant="outlined" color="secondary" disabled={loadingRun} onClick={() => requestRun('rerun')}>
            Kjør på nytt
          </Button>
        )}
        <Button size="small" variant="text" disabled={loadingInitial} onClick={() => void refreshPersisted()}>
          Oppdater status
        </Button>
      </Stack>

      {state.phase === 'RUNNING' && loadingRun && (
        <Stack direction="row" spacing={1} alignItems="center">
          <CircularProgress size={16} />
          <Typography variant="body2">Kjører AI-vurdering på de best rangerte kandidatene…</Typography>
        </Stack>
      )}

      {state.preview && (state.preview.candidates?.length ?? 0) > 0 && (
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Forhåndsvisning (uten full AI-vurdering)
            {state.preview.semanticSearchUsed === false && ' — semantisk søk ikke brukt'}
          </Typography>
          <Stack spacing={0.75}>
            {(state.preview.candidates ?? []).map((c) => (
              <Paper key={c.userId ?? c.name} sx={{ p: 1 }}>
                <Typography variant="body2">
                  <b>{c.name}</b>
                  {typeof c.combinedScore === 'number' ? ` • ${c.combinedScore.toFixed(1)}` : ''}
                </Typography>
                {c.reason && (
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                    {c.reason}
                  </Typography>
                )}
              </Paper>
            ))}
          </Stack>
        </Box>
      )}

      {!state.previewAvailable && !state.preview && (
        <Alert severity="info" sx={{ py: 0.5 }}>
          Forhåndsvisning er ikke tilgjengelig fra backend ennå. Bruk «Kjør AI-matching» for full vurdering,
          eller sjekk dekningstall over.
        </Alert>
      )}

      {hasAiResults ? (
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <Chip label="AI-vurdert" size="small" color="primary" variant="outlined" />
          </Stack>
          <Stack spacing={0.75}>
            {aiMatches
              .slice()
              .sort((a: MatchCandidateDto, b: MatchCandidateDto) => (b.score ?? 0) - (a.score ?? 0))
              .slice(0, limit)
              .map((s: MatchCandidateDto) => renderConsultant(s, s.userId ?? s.name))}
          </Stack>
        </Box>
      ) : !state.preview && state.phase !== 'RUNNING' && (
        <Typography variant="body2" color="text.secondary">
          Ingen lagrede AI-resultater ennå. Start med forhåndsvisning eller kjør AI-matching.
        </Typography>
      )}

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
