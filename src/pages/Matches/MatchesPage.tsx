import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  IconButton,
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
import { getMatchRequest, listMatchRequests } from '../../services/matchesRequestsService';
import type { CoverageStatus, MatchesListItemDto, PagedMatchesListDto } from '../../types/api';
import { useLocation } from 'react-router-dom';
import RequestMatchPanel from '../../components/matches/RequestMatchPanel';
import PageIntro from '../../components/PageIntro';
import { CoverageChips } from '../../components/matches/RequestCoverage';
import { describeAiStatus, describeCoverage } from '../../components/matches/coverageText';

/**
 * How a coverage status is drawn. The words come from the server, this only picks the paint.
 *
 * The status is over how many consultants hold a skill for every must of the request: green from
 * three, amber for one or two, red for none, grey when no requirement named a technology. It used
 * to be over how many people knew at least one of the technologies, green from five, and with 104
 * consultants that made 26 of 27 requests green. The server owns the rule; the page renders it.
 *
 * Colour is a thin left edge and a chip, not a wash over the whole card.
 */
const COVERAGE_STYLE: Record<CoverageStatus, { edge: string; chip: 'success' | 'warning' | 'error' | 'default'; Icon: typeof CheckCircleOutlineIcon }> = {
  GREEN: { edge: 'success.main', chip: 'success', Icon: CheckCircleOutlineIcon },
  YELLOW: { edge: 'warning.main', chip: 'warning', Icon: ReportProblemOutlinedIcon },
  RED: { edge: 'error.main', chip: 'error', Icon: ErrorOutlineIcon },
  NEUTRAL: { edge: 'divider', chip: 'default', Icon: HelpOutlineIcon },
};

type RequestCardProps = {
  pr: MatchesListItemDto;
  isOpen: boolean;
  /** Absent when the card stands alone on its own page and cannot be closed. */
  onToggle?: () => void;
};

/**
 * One request: who, what, when, how well the corpus covers it, and whether the AI has been run.
 *
 * One action on a card: open it. The header is clickable for the mouse, the button carries the
 * name for everyone else. There used to be a link "Åpne forespørselen" next to the arrow that did
 * nearly the same thing on another page, and a "N søketreff" count that read like N suitable
 * candidates.
 */
const RequestCard: React.FC<RequestCardProps> = ({ pr, isOpen, onToggle }) => {
  const id = pr.id;
  const style = COVERAGE_STYLE[pr.coverageStatus] ?? COVERAGE_STYLE.NEUTRAL;
  const documentTitle = pr.title || `Forespørsel #${id}`;
  const meta = [
    pr.deadlineDate ? `Frist ${new Date(pr.deadlineDate).toLocaleDateString('no-NO')}` : null,
    pr.date ? `lastet opp ${new Date(pr.date).toLocaleDateString('no-NO')}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <Paper
      sx={{
        p: { xs: 1.5, sm: 2 },
        borderLeft: 3,
        borderLeftColor: style.edge,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
      }}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ sm: 'flex-start' }}
        justifyContent="space-between"
        onClick={onToggle}
        sx={{ cursor: onToggle ? 'pointer' : 'default' }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          {/*
            Customer first and largest. It is what somebody scanning the list is looking for, and
            it used to sit in grey below a document heading that can run to a full line of tender
            boilerplate.
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
            Two lines and no more, with the whole thing on hover and in the open card.
            "Konsulentoppdrag: modernisering av fagsystem for kjøretøydata" is a heading worth
            showing; four lines of it pushes the rest off the screen.
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
          {meta && (
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
              {meta}
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
            {onToggle && (
              <IconButton
                size="small"
                aria-label={isOpen ? 'Lukk' : 'Utvid'}
                aria-expanded={isOpen}
                onClick={(e) => { e.stopPropagation(); onToggle(); }}
              >
                {isOpen ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )}
          </Stack>
          {/* One word on the AI, with its date: the only number here that means somebody was assessed. */}
          <Typography variant="caption" color={pr.aiMatchCount ? 'text.primary' : 'text.secondary'}>
            {describeAiStatus(pr.aiMatchCount, pr.aiLastUpdated)}
          </Typography>
        </Stack>
      </Stack>

      {/*
        The requirements with their counts: the musts on the closed card, everything in the panel.
        The red chip is the bottleneck; that is what a reader scanning the list is looking for, and
        the old card hid it behind a green "God søkedekning".
      */}
      {pr.coverage && !isOpen && (
        <Box sx={{ mt: 1.25 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            {describeCoverage(pr.coverage)}
          </Typography>
          <CoverageChips coverage={pr.coverage} mustOnly />
        </Box>
      )}

      {isOpen && (
        <Box sx={{ mt: 2, pt: 2, borderTop: 1, borderColor: 'divider' }}>
          <RequestMatchPanel requestId={id} coverage={pr.coverage} />
        </Box>
      )}
    </Paper>
  );
};

const MatchesPage: React.FC = () => {
  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const requestIdParam = params.get('requestId');
  const requestId = requestIdParam ? Number(requestIdParam) : null;

  const [page, setPage] = useState<PagedMatchesListDto | null>(null);
  const [single, setSingle] = useState<MatchesListItemDto | null | undefined>(undefined);
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

  // The single-request page shows the same card as the list, open, so the requirements and their
  // counts are there too; it used to show the panel under a bare "Kundeforespørsel #12".
  useEffect(() => {
    if (!requestId) return;
    let cancelled = false;
    setSingle(undefined);
    getMatchRequest(requestId)
      .then((item) => { if (!cancelled) setSingle(item); })
      .catch(() => { if (!cancelled) setSingle(null); });
    return () => { cancelled = true; };
  }, [requestId]);

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
      <PageIntro page="matches" />

      {requestId && single === undefined && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress />
        </Box>
      )}
      {requestId && single && <RequestCard pr={single} isOpen />}
      {requestId && single === null && (
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1.5 }}>Kundeforespørsel #{requestId}</Typography>
          <RequestMatchPanel requestId={requestId} />
        </Paper>
      )}

      {/*
        Stands outside the page help, because it qualifies the numbers the cards show. The help can
        be switched off; a number that means something other than what it looks like cannot be left
        unexplained on screen.
      */}
      {!requestId && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, maxWidth: 760 }}>
          Tallet på hvert krav er hvor mange aktive konsulenter som har den ferdigheten på CV-en, og
          merket er hvor mange som har noe for hvert må-krav. Det sier hvem som finnes, ikke hvem
          som passer. Vurderingen gjør du i kortet.
        </Typography>
      )}

      {!requestId && (
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1} alignItems={{ sm: 'center' }} justifyContent="space-between" sx={{ mb: 1 }}>
          <Typography variant="caption">Sortering: nyeste først</Typography>
          <Stack direction="row" spacing={1} alignItems="center">
            <Typography variant="caption">Størrelse</Typography>
            <Button size="small" variant={pageSize === 10 ? 'contained' : 'outlined'} onClick={() => setPageSize(10)}>10</Button>
            <Button size="small" variant={pageSize === 20 ? 'contained' : 'outlined'} onClick={() => setPageSize(20)}>20</Button>
            <Button size="small" variant={pageSize === 50 ? 'contained' : 'outlined'} onClick={() => setPageSize(50)}>50</Button>
          </Stack>
        </Stack>
      )}

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
          {rows.map((pr) => (
            <RequestCard
              key={pr.id}
              pr={pr}
              isOpen={Boolean(expanded[pr.id])}
              onToggle={() => toggleExpand(pr.id)}
            />
          ))}
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
