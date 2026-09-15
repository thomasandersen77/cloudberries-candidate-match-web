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
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { listMatchRequests } from '../../services/matchesRequestsService';
import type { CoverageStatus, PagedMatchesListDto } from '../../types/api';
import { Link as RouterLink, useLocation } from 'react-router-dom';
import RequestMatchPanel from '../../components/matches/RequestMatchPanel';
import PageIntro from '../../components/PageIntro';

/**
 * How a coverage status is drawn. The words come from the server, this only picks the paint.
 *
 * There used to be a second definition here: a fallback that turned a hit count into a status with
 * its own thresholds, green at 10 where the server says 5, red at 2 where the server says 1. Both
 * ran against the same data and disagreed about it. The server owns the rule now; `coverageStatus`
 * and `coverageLabel` are required fields, so there was never a case for the fallback to cover.
 *
 * Colour is a thin left edge and a chip, not a wash over the whole card. A card filled edge to edge
 * with success.light reads as "this request is handled", and it means "somebody in the company has
 * heard of one of these technologies".
 */
const COVERAGE_STYLE: Record<CoverageStatus, { edge: string; chip: 'success' | 'warning' | 'error' | 'default'; Icon: typeof CheckCircleOutlineIcon }> = {
  GREEN: { edge: 'success.main', chip: 'success', Icon: CheckCircleOutlineIcon },
  YELLOW: { edge: 'warning.main', chip: 'warning', Icon: ReportProblemOutlinedIcon },
  RED: { edge: 'error.main', chip: 'error', Icon: ErrorOutlineIcon },
  NEUTRAL: { edge: 'divider', chip: 'default', Icon: HelpOutlineIcon },
};

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
      {/*
        The standing note about AI never running by itself is part of the intro now. It said the
        same thing, and two paragraphs of small grey text under one heading is one too many.
      */}
      <PageIntro page="matches" />

      {requestId && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1.5 }}>Kundeforespørsel #{requestId}</Typography>
          <RequestMatchPanel requestId={requestId} />
        </Paper>
      )}

      {/*
        Stands outside the page help, because it qualifies a number the cards show. The help can be
        switched off; a count that means something other than what it looks like cannot be left
        unexplained on screen.
      */}
      {!requestId && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, maxWidth: 760 }}>
          Søketreff er konsulenter som har minst én av teknologiene i forespørselen. Det sier at det
          finnes noen å se på, ikke at kravene er oppfylt. Åpne en forespørsel for å vurdere
          kandidater mot den.
        </Typography>
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
            const count = typeof pr.hitCount === 'number' ? pr.hitCount : undefined;
            const style = COVERAGE_STYLE[pr.coverageStatus] ?? COVERAGE_STYLE.NEUTRAL;
            const isOpen = Boolean(id && expanded[id]);
            const documentTitle = pr.title || `Forespørsel #${id}`;

            return (
              <Paper
                key={id ?? Math.random()}
                sx={{
                  p: { xs: 1.5, sm: 2 },
                  borderLeft: 3,
                  borderLeftColor: style.edge,
                  borderTopLeftRadius: 0,
                  borderBottomLeftRadius: 0,
                }}
              >
                <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'flex-start' }} justifyContent="space-between">
                  <Box sx={{ flex: 1, minWidth: 0 }}>
                    {/*
                      Customer first and largest. It is what somebody scanning the list is looking
                      for, and it used to sit in grey below a document heading that can run to a
                      full line of tender boilerplate.
                    */}
                    <Typography variant="subtitle1" sx={{ fontWeight: 700, lineHeight: 1.3 }}>
                      {pr.customerName || 'Ukjent kunde'}
                    </Typography>
                    {pr.role && (
                      <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary', mt: 0.25 }}>
                        {pr.role}
                      </Typography>
                    )}
                    {/*
                      Two lines and no more, with the whole thing on hover and in the expanded card.
                      "Konsulentoppdrag: modernisering av fagsystem for kjøretøydata" is a heading
                      worth showing; four lines of it pushes the controls off the screen.
                    */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      title={documentTitle}
                      sx={
                        isOpen
                          ? { mt: 0.25 }
                          : {
                              mt: 0.25,
                              display: '-webkit-box',
                              WebkitLineClamp: 2,
                              WebkitBoxOrient: 'vertical',
                              overflow: 'hidden',
                            }
                      }
                    >
                      {documentTitle}
                    </Typography>
                    {pr.date && (
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                        Lastet opp {new Date(pr.date).toLocaleString('no-NO')}
                      </Typography>
                    )}
                  </Box>

                  <Stack spacing={0.75} alignItems={{ xs: 'flex-start', sm: 'flex-end' }} sx={{ flexShrink: 0 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <Chip
                        size="small"
                        variant="outlined"
                        color={style.chip}
                        icon={<style.Icon sx={{ fontSize: 16 }} />}
                        label={pr.coverageLabel}
                      />
                      {id && (
                        <IconButton
                          size="small"
                          aria-label={isOpen ? 'Lukk' : 'Utvid'}
                          onClick={() => toggleExpand(id)}
                        >
                          {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                        </IconButton>
                      )}
                    </Stack>
                    {/*
                      Spelled out as søketreff. The chip used to read "Treff: 49", which is the
                      number of consultants who know at least one of the request's technologies and
                      reads like 49 candidates were found suitable. Nobody has been assessed yet at
                      this point.
                    */}
                    <Typography variant="caption" color="text.secondary">
                      {typeof count === 'number' ? `${count} søketreff` : 'Ingen ferdigheter å søke på'}
                    </Typography>
                    {id && (
                      <MuiLink component={RouterLink} to={`/matches?requestId=${id}`} underline="hover" variant="caption">
                        Åpne forespørselen
                      </MuiLink>
                    )}
                  </Stack>
                </Stack>

                {isOpen && id && (
                  <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
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
