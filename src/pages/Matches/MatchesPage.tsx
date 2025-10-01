import React, { useEffect, useMemo, useState } from 'react';
import { Box, Chip, CircularProgress, Container, IconButton, Link as MuiLink, Paper, Stack, Typography } from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { listProjectRequestsPaged, getProjectRequestSuggestions } from '../../services/projectRequestsService';
import type { AISuggestionDto, PagedProjectRequestResponseDto } from '../../types/api';
import { Link as RouterLink } from 'react-router-dom';

// Helper to decide coverage color/status from count
function getCoverage(count: number | undefined) {
  if (typeof count !== 'number') return { color: undefined as string | undefined, label: 'Ukjent dekning' };
  if (count >= 10) return { color: 'success.light', label: 'God dekning' };
  if (count <= 2) return { color: 'error.light', label: 'Lav dekning' };
  if (count >= 5) return { color: 'warning.light', label: 'Begrenset dekning' };
  return { color: undefined, label: 'Moderat dekning' }; // 3–4
}

const MatchesPage: React.FC = () => {
  const [page, setPage] = useState<PagedProjectRequestResponseDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<number, boolean>>({});
  const [suggestions, setSuggestions] = useState<Record<number, AISuggestionDto[] | 'loading' | 'error'>>({});

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const p = await listProjectRequestsPaged({ page: 0, size: 20, sort: 'uploadedAt,desc' });
        setPage(p);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Prefetch coverage counts in background for first page (optional)
  useEffect(() => {
    const content = page?.content ?? [];
    // Limit parallel fetches to avoid overload
    const firstTen = content.slice(0, 10);
    firstTen.forEach((pr, idx) => {
      const id = pr.id as number | undefined;
      if (!id || suggestions[id]) return;
      // Stagger to avoid burst
      setTimeout(async () => {
        setSuggestions(prev => ({ ...prev, [id]: 'loading' }));
        try {
          const s = await getProjectRequestSuggestions(id);
          setSuggestions(prev => ({ ...prev, [id]: s }));
        } catch {
          setSuggestions(prev => ({ ...prev, [id]: 'error' }));
        }
      }, idx * 100);
    });
  }, [page]);

  const rows = useMemo(() => page?.content ?? [], [page]);

  const toggleExpand = async (id: number) => {
    setExpanded(prev => ({ ...prev, [id]: !prev[id] }));
    if (!suggestions[id]) {
      setSuggestions(prev => ({ ...prev, [id]: 'loading' }));
      try {
        const s = await getProjectRequestSuggestions(id);
        setSuggestions(prev => ({ ...prev, [id]: s }));
      } catch {
        setSuggestions(prev => ({ ...prev, [id]: 'error' }));
      }
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Matcher</Typography>

      {loading && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>Laster prosjektforespørsler…</Typography>
        </Box>
      )}

      {!loading && rows.length === 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="body1">Ingen prosjektforespørsler funnet.</Typography>
        </Paper>
      )}

      <Stack spacing={1}>
        {rows.map((pr) => {
          const id = pr.id as number | undefined;
          const sugg = id ? suggestions[id] : undefined;
          const count = Array.isArray(sugg) ? sugg.length : undefined;
          const coverage = getCoverage(count);
          const bg = coverage.color ? { bgcolor: coverage.color } : {};

          return (
            <Paper key={id ?? Math.random()} sx={{ p: 1.5, ...bg }}>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between">
                <Box sx={{ flex: 1, minWidth: 260 }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                    {pr.title || pr.summary || pr.originalFilename || `Forespørsel #${id}`}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {pr.customerName ? `${pr.customerName} • ` : ''}
                    {pr.uploadedAt ? new Date(pr.uploadedAt).toLocaleString('no-NO') : ''}
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
                  {sugg === 'loading' && (
                    <Stack direction="row" spacing={1} alignItems="center">
                      <CircularProgress size={16} />
                      <Typography variant="body2">Henter forslag…</Typography>
                    </Stack>
                  )}
                  {sugg === 'error' && (
                    <Typography variant="body2" color="error.main">Kunne ikke hente forslag.</Typography>
                  )}
                  {Array.isArray(sugg) && (
                    <Stack spacing={1}>
                      {(sugg
                        .slice() // copy before sort
                        .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))
                        .slice(0, 5)
                      ).map((s, i) => (
                        <Paper key={i} sx={{ p: 1 }}>
                          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} justifyContent="space-between" alignItems={{ sm: 'center' }}>
                            <Typography variant="body2">
                              <b>{s.consultantName}</b>{typeof s.matchScore === 'number' ? ` • score ${s.matchScore.toFixed(1)}` : ''}
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
                            <Typography variant="caption" sx={{ display: 'block', mt: 0.5 }} color="text.secondary">
                              {s.justification}
                            </Typography>
                          )}
                        </Paper>
                      ))}
                    </Stack>
                  )}
                </Box>
              )}
            </Paper>
          );
        })}
      </Stack>
    </Container>
  );
};

export default MatchesPage;
