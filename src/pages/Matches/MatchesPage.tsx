import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Box, Button, Chip, CircularProgress, Container, IconButton, Link as MuiLink, MenuItem, Paper, Stack, TextField, ToggleButton, ToggleButtonGroup, Tooltip, Typography, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { listMatchRequests, getTopConsultantsForRequest, reAnalyzeRequest } from '../../services/matchesRequestsService';
import type { PagedMatchesListDto, MatchConsultantDto, CoverageStatus, ModelTier } from '../../types/api';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { getMatchStatus, getTopMatchesFlat, recalculateMatches } from '../../services/newMatchesService';
import { projectMatchesService } from '../../services/projectMatchesService';
import { isAxiosError } from 'axios';

// Helper to decide coverage color/status from count
function getCoverageFromStatus(status?: CoverageStatus | null, label?: string | null, hitCount?: number | null) {
  if (status) {
    const map: Record<Exclude<CoverageStatus, 'NEUTRAL'> | 'NEUTRAL', string | undefined> = {
      GREEN: 'success.light',
      YELLOW: 'warning.light',
      RED: 'error.light',
      NEUTRAL: undefined,
    };
    return { color: map[status] as string | undefined, label: label || (status === 'GREEN' ? 'God dekning' : status === 'YELLOW' ? 'Begrenset dekning' : status === 'RED' ? 'Lav dekning' : 'Nøytral') };
  }
  // Fallback to thresholds if status not provided
  const count = typeof hitCount === 'number' ? hitCount : undefined;
  if (typeof count !== 'number') return { color: undefined as string | undefined, label: 'Ukjent dekning' };
  if (count >= 10) return { color: 'success.light', label: 'God dekning' };
  if (count <= 2) return { color: 'error.light', label: 'Lav dekning' };
  if (count >= 5) return { color: 'warning.light', label: 'Begrenset dekning' };
  return { color: undefined, label: 'Moderat dekning' };
}

// Tuning options for an explicit AI re-run. GET top-consultants is cache-aware
// and never receives these; they are only sent on POST re-analyze.
const MODEL_TIERS: ReadonlyArray<{ value: ModelTier; label: string }> = [
  { value: 'FAST', label: 'Rask' },
  { value: 'DEFAULT', label: 'Balansert' },
  { value: 'QUALITY', label: 'Best kvalitet' },
];
const CV_WEIGHT_OPTIONS: readonly number[] = [20, 30, 60, 80];
const DEFAULT_MODEL_TIER: ModelTier = 'DEFAULT';
const DEFAULT_CV_WEIGHT_PERCENT = 30;

function extractErrorMessage(error: unknown, fallback: string): string {
  if (isAxiosError(error)) {
    if (error.code === 'ECONNABORTED') return 'Tidsavbrudd hos backend. Prøv igjen om noen sekunder.';
    return (error.response?.data as { message?: string } | undefined)?.message ?? error.message;
  }
  if (error instanceof Error && error.message) return error.message;
  return fallback;
}

const MatchesPage: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const requestIdParam = params.get('requestId');
  const requestId = requestIdParam ? Number(requestIdParam) : null;

  const [page, setPage] = useState<PagedMatchesListDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [top5, setTop5] = useState<Record<number, MatchConsultantDto[] | 'loading' | 'error'>>({});
  const [top5Error, setTop5Error] = useState<Record<number, string>>({});
  const [analyzing, setAnalyzing] = useState<Record<number, boolean>>({});
  const [pageSize, setPageSize] = useState<number>(20);
  // Re-run tuning. Defaults are not persisted (reset to DEFAULT/30 every visit).
  const [modelTier, setModelTier] = useState<ModelTier>(DEFAULT_MODEL_TIER);
  const [cvWeightPercent, setCvWeightPercent] = useState<number>(DEFAULT_CV_WEIGHT_PERCENT);
  // Per-request "last updated" timestamp from the persisted matches.
  const [lastUpdated, setLastUpdated] = useState<Record<number, string>>({});

  // Guard against state updates after unmount while polling.
  const mountedRef = useRef(true);
  useEffect(() => () => { mountedRef.current = false; }, []);

  // Status mode state
  const [status, setStatus] = useState<'PENDING'|'RUNNING'|'COMPLETED'|'FAILED'|null>(null);
  const [flat, setFlat] = useState<Array<{ name: string; score: number; reasons: string[]; profileUrl?: string | null }>>([]);
  const [polling, setPolling] = useState(false);

  const loadPage = async (pageIndex: number) => {
    setLoading(true);
    try {
      const p = await listMatchRequests({ page: pageIndex, size: pageSize, sort: 'date,desc' });
      setPage(p);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (requestId) return; // dedicated mode, skip list
    loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, requestId]);

  // Poll status when requestId mode is active
  useEffect(() => {
    if (!requestId) return;
    let cancelled = false;
    let timer: number | undefined;

    const tick = async () => {
      try {
        const s = await getMatchStatus(requestId);
        if (cancelled) return;
        setStatus(s.status as 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED');
        if (s.status === 'COMPLETED') {
          const items = await getTopMatchesFlat(requestId, 10);
          if (!cancelled) setFlat(items.map(i => ({ name: i.name, score: i.score, reasons: i.reasons, profileUrl: i.profileUrl })));
          setPolling(false);
          return;
        }
        setPolling(true);
        timer = window.setTimeout(tick, 1500);
      } catch {
        if (!cancelled) setPolling(false);
      }
    };
    tick();

    return () => { cancelled = true; if (timer) window.clearTimeout(timer); };
  }, [requestId]);

  // No longer prefetching; coverage comes from list item (hitCount/coverageStatus)
  useEffect(() => {
    setTop5({});
  }, [page?.currentPage]);

  const rows = useMemo(() => page?.content ?? [], [page]);

  // Best-effort fetch of the persisted "last updated" timestamp.
  const refreshLastUpdated = async (id: number) => {
    try {
      const top = await projectMatchesService.getTopMatches(id);
      if (mountedRef.current && top?.lastUpdated) {
        setLastUpdated((prev) => ({ ...prev, [id]: top.lastUpdated as string }));
      }
    } catch {
      /* timestamp is non-critical */
    }
  };

  // GET top-consultants is cache-aware: it returns the persisted result without
  // a new LLM call. No model/weight params are sent here.
  const loadTopConsultants = async (id: number, force = false) => {
    if (!force && Array.isArray(top5[id])) return;
    setTop5(prev => ({ ...prev, [id]: 'loading' }));
    setTop5Error(prev => ({ ...prev, [id]: '' }));
    try {
      const s = await getTopConsultantsForRequest(id, 5);
      if (!mountedRef.current) return;
      setTop5(prev => ({ ...prev, [id]: s }));
      void refreshLastUpdated(id);
    } catch (error) {
      const message = extractErrorMessage(error, 'Ukjent feil ved henting av toppkandidater.');
      setTop5(prev => ({ ...prev, [id]: 'error' }));
      setTop5Error(prev => ({ ...prev, [id]: message }));
    }
  };

  const toggleExpand = async (id: number) => {
    const nextOpen = !expanded[id];
    setExpanded(prev => ({ ...prev, [id]: nextOpen }));
    if (nextOpen && !top5[id]) {
      await loadTopConsultants(id);
    }
  };

  // Explicit re-run (POST re-analyze): forces a fresh LLM computation with the
  // chosen modelTier + cvWeightPercent and replaces the list with the response.
  const rerunAnalysis = async (id: number) => {
    setAnalyzing((prev) => ({ ...prev, [id]: true }));
    setTop5((prev) => ({ ...prev, [id]: 'loading' }));
    setTop5Error((prev) => ({ ...prev, [id]: '' }));
    try {
      const analyzed = await reAnalyzeRequest(id, { modelTier, cvWeightPercent });
      if (!mountedRef.current) return;
      setTop5((prev) => ({ ...prev, [id]: Array.isArray(analyzed) ? analyzed : [] }));
      void refreshLastUpdated(id);
    } catch (error) {
      if (!mountedRef.current) return;
      const message = extractErrorMessage(error, 'Ukjent feil under analyse.');
      setTop5((prev) => ({ ...prev, [id]: 'error' }));
      setTop5Error((prev) => ({ ...prev, [id]: message }));
    } finally {
      if (mountedRef.current) setAnalyzing((prev) => ({ ...prev, [id]: false }));
    }
  };

  const renderTuning = (id: number) => (
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} flexWrap="wrap" useFlexGap>
      <TextField
        select
        size="small"
        label="Modell"
        value={modelTier}
        onChange={(e) => setModelTier(e.target.value as ModelTier)}
        disabled={analyzing[id]}
        sx={{ minWidth: 150 }}
      >
        {MODEL_TIERS.map((t) => (
          <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
        ))}
      </TextField>
      <Stack spacing={0.25}>
        <Typography variant="caption" color="text.secondary">CV-kvalitet teller</Typography>
        <ToggleButtonGroup
          size="small"
          exclusive
          value={cvWeightPercent}
          onChange={(_e, val) => { if (val != null) setCvWeightPercent(val as number); }}
          aria-label="CV-kvalitet teller"
        >
          {CV_WEIGHT_OPTIONS.map((w) => (
            <ToggleButton key={w} value={w} disabled={analyzing[id]}>{w}%</ToggleButton>
          ))}
        </ToggleButtonGroup>
      </Stack>
      <Typography variant="caption" color="text.secondary" sx={{ maxWidth: 260 }}>
        Resten teller som skills. Brukes kun ved «Kjør på nytt».
      </Typography>
    </Stack>
  );

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Matcher</Typography>

      {/* Request-specific mode */}
      {requestId && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between">
            <Typography variant="subtitle1">Kundeforespørsel #{requestId}</Typography>
            <Stack direction="row" spacing={1}>
              <Chip label={`Status: ${status ?? 'ukjent'}`} color={status === 'COMPLETED' ? 'success' : status === 'FAILED' ? 'error' : 'default'} />
              <Button size="small" variant="outlined" onClick={async () => { if (!requestId) return; await recalculateMatches(requestId); setStatus('PENDING'); setFlat([]); }}>
                Reberegn
              </Button>
              <Button size="small" variant="text" onClick={() => {
                // Export CSV
                const lines = ['name;score;reasons'];
                flat.forEach(i => lines.push(`${i.name};${i.score};${(i.reasons||[]).join(' | ').replace(/\n/g,' ')}`));
                const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url; a.download = `matches-${requestId}.csv`; a.click(); URL.revokeObjectURL(url);
              }} disabled={!flat.length}>
                Eksporter CSV
              </Button>
            </Stack>
          </Stack>
          {(!flat.length && (status === 'PENDING' || status === 'RUNNING')) && (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <CircularProgress size={16} />
              <Typography variant="body2" sx={{ ml: 1, display: 'inline' }}>{polling ? 'Venter på resultat…' : 'Ingen data'}</Typography>
            </Box>
          )}
          {flat.length > 0 && (
            <Table size="small" stickyHeader sx={{ mt: 1 }}>
              <TableHead>
                <TableRow>
                  <TableCell>Navn</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Begrunnelser</TableCell>
                  <TableCell>Profil</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {flat.map((r, i) => (
                  <TableRow key={i}>
                    <TableCell>{r.name}</TableCell>
                    <TableCell>{r.score}</TableCell>
                    <TableCell>{r.reasons?.slice(0,3).join(' • ')}</TableCell>
                    <TableCell>{r.profileUrl ? <MuiLink component={RouterLink} to={r.profileUrl}>Åpne</MuiLink> : '-'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between" sx={{ mb: 1 }}>
        <Typography variant="caption">Sortering: nyeste først</Typography>
        <Stack direction="row" spacing={1} alignItems="center">
          <Typography variant="caption">Størrelse</Typography>
          <Button size="small" variant={pageSize === 10 ? 'contained' : 'outlined'} onClick={() => setPageSize(10)}>10</Button>
          <Button size="small" variant={pageSize === 20 ? 'contained' : 'outlined'} onClick={() => setPageSize(20)}>20</Button>
          <Button size="small" variant={pageSize === 50 ? 'contained' : 'outlined'} onClick={() => setPageSize(50)}>50</Button>
        </Stack>
      </Stack>

      {!requestId && loading && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>Laster prosjektforespørsler…</Typography>
        </Box>
      )}

      {!requestId && !loading && rows.length === 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="body1">Ingen prosjektforespørsler funnet.</Typography>
        </Paper>
      )}

      {!requestId && (
      <Stack spacing={1}>
        {rows.map((pr) => {
          const id = pr.id as number | undefined;
          const count = pr.hitCount ?? undefined;
          const coverage = getCoverageFromStatus(pr.coverageStatus, pr.coverageLabel, count);
          const bg = coverage.color ? { bgcolor: coverage.color } : {};

          return (
            <Paper key={id ?? Math.random()} sx={{ p: 1.5, ...bg }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between">
                <Box sx={{ flex: 1, minWidth: 260 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {pr.title || `Forespørsel #${id}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {pr.customerName ? `${pr.customerName} • ` : ''}
                    {pr.date ? new Date(pr.date).toLocaleString('no-NO') : ''}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} alignItems="center">
                  <Chip size="small" label={coverage.label} />
                  <Chip size="small" color="primary" variant="outlined" label={`Treff: ${typeof count === 'number' ? count : '–'}`} />
                  {id && (
                    <MuiLink component={RouterLink} to={`/project-requests/${id}`} underline="hover">
                      Detaljer
                    </MuiLink>
                  )}
                  <IconButton aria-label={expanded[id!] ? 'Lukk' : 'Utvid'} onClick={() => id && toggleExpand(id)}>
                    {expanded[id!] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                  </IconButton>
                </Stack>
              </Stack>

              {expanded[id!] && (
                <Box sx={{ mt: 1.5, pl: 0.5 }}>
                  {top5[id!] === 'loading' && (
                    <Stack spacing={1}>
                      <Stack direction="row" spacing={1} alignItems="center">
                        <CircularProgress size={16} />
                        <Typography variant="body2">Analyserer kandidater med Gemini AI…</Typography>
                      </Stack>
                      <Typography variant="caption" color="text.secondary" sx={{ pl: 3 }}>
                        Rangerer topp kandidater basert på krav og CV-kvalitet
                      </Typography>
                    </Stack>
                  )}
                  {top5[id!] === 'error' && (
                    <Stack spacing={1}>
                      <Typography variant="body2" color="error.main">
                        {top5Error[id!] || 'Kunne ikke hente toppkandidater.'}
                      </Typography>
                      {renderTuning(id!)}
                      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }}>
                        <Button size="small" variant="outlined" onClick={() => loadTopConsultants(id!, true)}>
                          Prøv igjen
                        </Button>
                        <Button
                          size="small"
                          variant="contained"
                          disabled={analyzing[id!]}
                          onClick={() => rerunAnalysis(id!)}
                        >
                          {analyzing[id!] ? 'Kjører…' : 'Kjør på nytt'}
                        </Button>
                      </Stack>
                    </Stack>
                  )}
                  {Array.isArray(top5[id!]) && (
                    <Stack spacing={1}>
                      {(top5[id!] as MatchConsultantDto[]).length === 0 ? (
                        <Stack spacing={1}>
                          <Typography variant="body2" color="text.secondary">
                            Ingen konsulenter funnet for denne forespørselen.
                          </Typography>
                          {renderTuning(id!)}
                          <Button
                            size="small"
                            variant="contained"
                            disabled={analyzing[id!]}
                            onClick={() => rerunAnalysis(id!)}
                            sx={{ alignSelf: 'flex-start' }}
                          >
                            {analyzing[id!] ? 'Kjører…' : 'Kjør på nytt'}
                          </Button>
                        </Stack>
                      ) : (
                        <>
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between" sx={{ mb: 1 }}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Chip label="AI-rangert" size="small" color="primary" variant="outlined" />
                              {lastUpdated[id!] && (
                                <Typography variant="caption" color="text.secondary">
                                  Sist oppdatert: {new Date(lastUpdated[id!]).toLocaleString('no-NO')}
                                </Typography>
                              )}
                            </Stack>
                          </Stack>
                          <Box sx={{ mb: 1 }}>
                            {renderTuning(id!)}
                          </Box>
                          <Button
                            size="small"
                            variant="contained"
                            disabled={analyzing[id!]}
                            onClick={() => rerunAnalysis(id!)}
                            sx={{ alignSelf: 'flex-start', mb: 1 }}
                          >
                            {analyzing[id!] ? 'Kjører…' : 'Kjør på nytt'}
                          </Button>
                          {((top5[id!] as MatchConsultantDto[])
                            .slice()
                            .sort((a, b) => (b.relevanceScore ?? 0) - (a.relevanceScore ?? 0))
                            .slice(0, 5)
                          ).map((s, i) => (
                          <Paper key={i} sx={{ p: 1 }}>
                            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                              <Typography variant="body2">
                                <b>{s.name}</b>{typeof s.relevanceScore === 'number' ? ` • score ${s.relevanceScore.toFixed(2)}` : ''}
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
                          {/* skills kan komme fra AISuggestionDto; MatchConsultantDto har ikke skills */}
                          {s.justification && (
                            <Tooltip title={s.justification} placement="bottom-start">
                              <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }} color="text.secondary">
                                {s.justification.length > 140 ? s.justification.slice(0, 140) + '…' : s.justification}
                              </Typography>
                            </Tooltip>
                          )}
                          </Paper>
                        ))}
                        </>
                      )}
                    </Stack>
                  )}
                </Box>
              )}
            </Paper>
          );
        })}
      </Stack>
      )}

      {/* Pagination controls */}
      {!requestId && page && (
        <Stack direction="row" spacing={1} alignItems="center" justifyContent="flex-end" sx={{ mt: 2 }}>
          <Typography variant="caption">Side {typeof page.currentPage === 'number' ? page.currentPage + 1 : 1} av {page.totalPages ?? '?'}</Typography>
          <Button size="small" variant="outlined" onClick={() => loadPage(Math.max(0, (page.currentPage ?? 0) - 1))} disabled={!page.hasPrevious}>
            Forrige
          </Button>
          <Button size="small" variant="contained" onClick={() => loadPage((page.currentPage ?? 0) + 1)} disabled={!page.hasNext}>
            Neste
          </Button>
        </Stack>
      )}
    </Container>
  );
};

export default MatchesPage;
