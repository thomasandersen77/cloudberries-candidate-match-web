import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
  Link as MuiLink,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { listMatchRequests } from '../../services/matchesRequestsService';
import type { CoverageStatus, PagedMatchesListDto } from '../../types/api';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import RequestMatchPanel from '../../components/matches/RequestMatchPanel';

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
  const [pageSize, setPageSize] = useState<number>(20);

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
    if (requestId) return;
    loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, requestId]);

  useEffect(() => {
    setExpanded({});
  }, [page?.currentPage]);

  const rows = useMemo(() => page?.content ?? [], [page]);

  const toggleExpand = (id: number) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Matcher</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, maxWidth: 720 }}>
        Matching skjer kun når du eksplisitt velger «Forhåndsvis kandidater» eller «Kjør AI-matching».
        Ingen AI-kall kjøres automatisk ved sidevisning.
      </Typography>

      {requestId && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1.5 }}>Kundeforespørsel #{requestId}</Typography>
          <RequestMatchPanel requestId={requestId} />
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
                      <MuiLink component={RouterLink} to={`/matches?requestId=${id}`} underline="hover">
                        Matcher
                      </MuiLink>
                    )}
                    <IconButton aria-label={expanded[id!] ? 'Lukk' : 'Utvid'} onClick={() => id && toggleExpand(id)}>
                      {expanded[id!] ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                    </IconButton>
                  </Stack>
                </Stack>

                {expanded[id!] && id && (
                  <Box sx={{ mt: 1.5, pl: 0.5 }}>
                    <RequestMatchPanel requestId={id} hitCount={count} />
                  </Box>
                )}
              </Paper>
            );
          })}
        </Stack>
      )}

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
