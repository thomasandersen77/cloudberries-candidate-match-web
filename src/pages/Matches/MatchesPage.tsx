import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Chip, CircularProgress, Container, IconButton, Link as MuiLink, Paper, Stack, Tooltip, Typography, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { listMatchRequests, getTopConsultantsForRequest } from '../../services/matchesRequestsService';
import type { PagedMatchesListDto, MatchConsultantDto, CoverageStatus } from '../../types/api';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import { getMatchStatus, getTopMatchesFlat, recalculateMatches } from '../../services/newMatchesService';

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

const MatchesPage: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const requestIdParam = params.get('requestId');
  const requestId = requestIdParam ? Number(requestIdParam) : null;

  const [page, setPage] = useState<PagedMatchesListDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [top5, setTop5] = useState<Record<number, MatchConsultantDto[] | 'loading' | 'error'>>({});
  const [pageSize, setPageSize] = useState<number>(20);

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
        setStatus(s.status);
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

  const toggleExpand = async (id: number) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    if (!top5[id]) {
      setTop5(prev => ({ ...prev, [id]: 'loading' }));
      try {
        const s = await getTopConsultantsForRequest(id, 5);
        console.log(`Fetched top consultants for request ${id}:`, s);
        setTop5(prev => ({ ...prev, [id]: s }));
      } catch (error) {
        console.error(`Error fetching top consultants for request ${id}:`, error);
        setTop5(prev => ({ ...prev, [id]: 'error' }));
      }
    }
  };

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
                    <Typography variant="body2" color="error.main">Kunne ikke hente topp 5.</Typography>
                  )}
                  {Array.isArray(top5[id!]) && (
                    <Stack spacing={1}>
                      {(top5[id!] as MatchConsultantDto[]).length === 0 ? (
                        <Typography variant="body2" color="text.secondary">Ingen konsulenter funnet for denne forespørselen.</Typography>
                      ) : (
                        <>
                          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
                            <Chip label="AI-rangert" size="small" color="primary" variant="outlined" />
                            <Typography variant="caption" color="text.secondary">
                              Gemini 3 Pro Preview
                            </Typography>
                          </Stack>
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
