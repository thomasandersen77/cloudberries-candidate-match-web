import React, { useEffect, useMemo, useState } from 'react';
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import type { SvgIconComponent } from '@mui/icons-material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined';
import HourglassEmptyOutlinedIcon from '@mui/icons-material/HourglassEmptyOutlined';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import ReportProblemOutlinedIcon from '@mui/icons-material/ReportProblemOutlined';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import { listMatchRequests } from '../../services/matchesRequestsService';
import type { CoverageStatus, MatchesListItemDto, PagedMatchesListDto } from '../../types/api';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import PageIntro from '../../components/PageIntro';
import { CoverageChips } from '../../components/matches/RequestCoverage';
import { describeAiStatus, describeCoverage, describeFullMatch } from '../../components/matches/coverageText';

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
const COVERAGE_STYLE: Record<CoverageStatus, { edge: string; tone: StatusTone; Icon: SvgIconComponent }> = {
  GREEN: { edge: 'success.main', tone: 'success', Icon: CheckCircleOutlineIcon },
  YELLOW: { edge: 'warning.main', tone: 'warning', Icon: ReportProblemOutlinedIcon },
  RED: { edge: 'error.main', tone: 'error', Icon: ErrorOutlineIcon },
  NEUTRAL: { edge: 'divider', tone: 'neutral', Icon: HelpOutlineIcon },
};

type StatusTone = 'success' | 'warning' | 'error' | 'neutral';

type StatusBoxProps = {
  tone: StatusTone;
  Icon: SvgIconComponent;
  label: string;
};

/**
 * One status in a frame: a thin border and a tint in its colour, the words in the same colour.
 *
 * The coverage and the AI status are drawn with this alike, the same size and face, so the eye
 * reads them as two answers to two questions and compares them. The AI status used to be a grey
 * caption under a coverage chip, and whether the model had been run was the one thing the list
 * did not show at a glance.
 */
const StatusBox: React.FC<StatusBoxProps> = ({ tone, Icon, label }) => (
  <Box
    sx={(theme) => {
      const main = tone === 'neutral' ? theme.palette.text.secondary : theme.palette[tone].main;
      return {
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        px: 1.25,
        py: 0.625,
        borderRadius: 2,
        border: `1.5px solid ${alpha(main, tone === 'neutral' ? 0.5 : 0.7)}`,
        backgroundColor: alpha(main, theme.palette.mode === 'dark' ? 0.12 : 0.06),
        color: main,
        fontWeight: 700,
        fontSize: '0.875rem',
        lineHeight: 1.3,
        whiteSpace: 'nowrap',
      };
    }}
  >
    <Icon sx={{ fontSize: 17, flexShrink: 0 }} />
    <span>{label}</span>
  </Box>
);

type RequestCardProps = {
  pr: MatchesListItemDto;
  /** Opens the request page. Absent on that page itself, where the card is the header. */
  onOpen?: () => void;
  /** Every requirement with its count, not only the musts the list card shows. */
  fullCoverage?: boolean;
  /** Every other card on the list is tinted, so a long list reads as rows rather than one wall. */
  muted?: boolean;
};

/**
 * One request: who, what, when, how well the corpus covers it, and whether the AI has been run.
 *
 * One action on a card: open it. The header is clickable for the mouse, the button carries the
 * name for everyone else. There used to be a link "Åpne forespørselen" next to the arrow that did
 * nearly the same thing on another page, and a "N søketreff" count that read like N suitable
 * candidates.
 */
export const RequestCard: React.FC<RequestCardProps> = ({ pr, onOpen, fullCoverage = false, muted = false }) => {
  const id = pr.id;
  const style = COVERAGE_STYLE[pr.coverageStatus] ?? COVERAGE_STYLE.NEUTRAL;
  const documentTitle = pr.title || `Forespørsel #${id}`;
  const meta = [
    pr.deadlineDate ? `Frist ${new Date(pr.deadlineDate).toLocaleDateString('nb-NO')}` : null,
    pr.date ? `lastet opp ${new Date(pr.date).toLocaleDateString('nb-NO')}` : null,
  ].filter(Boolean).join(' · ');

  return (
    <Paper
      sx={(theme) => ({
        p: { xs: 1.5, sm: 2 },
        borderLeft: 3,
        borderLeftColor: style.edge,
        borderTopLeftRadius: 0,
        borderBottomLeftRadius: 0,
        backgroundColor: muted
          ? (theme.palette.mode === 'dark' ? alpha('#fff', 0.035) : alpha(theme.palette.text.primary, 0.03))
          : undefined,
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
        ...(onOpen && {
          '&:hover': { transform: 'translateY(-1px)' },
          '&:hover .open-arrow': { color: 'primary.main' },
        }),
      })}
    >
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={1.5}
        alignItems={{ sm: 'flex-start' }}
        justifyContent="space-between"
        onClick={onOpen}
        sx={{ cursor: onOpen ? 'pointer' : 'default' }}
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
            Two lines and no more, with the whole thing on hover and on the request page.
            "Konsulentoppdrag: modernisering av fagsystem for kjøretøydata" is a heading worth
            showing; four lines of it pushes the rest off the screen.
          */}
          <Typography
            variant="body2"
            color="text.secondary"
            title={documentTitle}
            sx={
              fullCoverage
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

        {/*
          Two answers in two frames of one size: does the corpus cover it, and has the model been
          run. Green and orange for the AI because the reader asked for a verdict, not a count.
        */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
          <Stack spacing={0.75} sx={{ minWidth: { sm: 236 } }}>
            <StatusBox tone={style.tone} Icon={style.Icon} label={pr.coverageLabel} />
            <StatusBox
              tone={pr.aiMatchCount ? 'success' : 'warning'}
              Icon={pr.aiMatchCount ? AutoAwesomeOutlinedIcon : HourglassEmptyOutlinedIcon}
              label={describeAiStatus(pr.aiMatchCount, pr.aiLastUpdated)}
            />
          </Stack>
          {onOpen && (
            <IconButton
              size="small"
              aria-label="Åpne"
              className="open-arrow"
              onClick={(e) => { e.stopPropagation(); onOpen(); }}
            >
              <ChevronRightIcon />
            </IconButton>
          )}
        </Stack>
      </Stack>

      {/*
        The requirements with their counts: the musts on the closed card, everything in the panel.
        The red chip is the bottleneck; that is what a reader scanning the list is looking for, and
        the old card hid it behind a green "God søkedekning".
      */}
      {pr.coverage && (
        <Box sx={{ mt: 1.25 }}>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
            {describeCoverage(pr.coverage)}
          </Typography>
          {describeFullMatch(pr.coverage) && (
            <Typography variant="body2" sx={{ mb: 0.75 }}>{describeFullMatch(pr.coverage)}</Typography>
          )}
          <CoverageChips coverage={pr.coverage} mustOnly={!fullCoverage} />
        </Box>
      )}
    </Paper>
  );
};

/** The orders the list offers: the words a reader picks, and the `sort` the server takes. */
const SORT_OPTIONS = [
  { value: 'date,desc', label: 'Nyeste først' },
  { value: 'date,asc', label: 'Eldste først' },
  { value: 'ai,desc', label: 'AI-vurdert først' },
  { value: 'ai,asc', label: 'Ikke AI-vurdert først' },
  { value: 'coverage,desc', label: 'Flest treff først' },
  { value: 'coverage,asc', label: 'Færrest treff først' },
] as const;

type SortValue = (typeof SORT_OPTIONS)[number]['value'];

/** The coverage lights a reader can keep, in the words of the sort above. Grey has no chip; it shows when nothing is kept out. */
const COVERAGE_FILTERS: { status: CoverageStatus; label: string }[] = [
  { status: 'GREEN', label: 'Mange treff' },
  { status: 'YELLOW', label: 'Noen treff' },
  { status: 'RED', label: 'Få treff' },
];

type FilterChipProps = { label: string; active: boolean; onClick: () => void };

/** A filter that is on or off, drawn filled when on. */
const FilterChip: React.FC<FilterChipProps> = ({ label, active, onClick }) => (
  <Chip
    label={label}
    clickable
    onClick={onClick}
    variant={active ? 'filled' : 'outlined'}
    color={active ? 'primary' : 'default'}
    aria-pressed={active}
    sx={{ fontWeight: active ? 600 : 500 }}
  />
);

const MatchesPage: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const params = new URLSearchParams(location.search);
  const requestIdParam = params.get('requestId');
  const requestId = requestIdParam ? Number(requestIdParam) : null;

  const [page, setPage] = useState<PagedMatchesListDto | null>(null);
  const [loading, setLoading] = useState(true);
  const [pageSize, setPageSize] = useState<number>(20);
  const [sort, setSort] = useState<SortValue>('date,desc');
  const [assessed, setAssessed] = useState<boolean | null>(null);
  const [coverage, setCoverage] = useState<CoverageStatus[]>([]);
  const filtering = assessed !== null || coverage.length > 0;

  const loadPage = async (pageIndex: number) => {
    setLoading(true);
    try {
      const p = await listMatchRequests({ page: pageIndex, size: pageSize, sort, assessed, coverage });
      setPage(p);
    } finally {
      setLoading(false);
    }
  };

  // Any change to the order or the filters starts over from the first page.
  useEffect(() => {
    if (requestId) return;
    loadPage(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pageSize, requestId, sort, assessed, coverage]);

  const toggleCoverage = (status: CoverageStatus) =>
    setCoverage((current) => (current.includes(status) ? current.filter((s) => s !== status) : [...current, status]));

  const rows = useMemo(() => page?.content ?? [], [page]);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Matcher</Typography>
      <PageIntro page="matches" />

      {/* The old deep link; the request has its own page now. */}
      {requestId && <Navigate to={`/matches/${requestId}`} replace />}

      {/*
        Stands outside the page help, because it qualifies the numbers the cards show. The help can
        be switched off; a number that means something other than what it looks like cannot be left
        unexplained on screen.
      */}
      {!requestId && (
        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5, maxWidth: 760 }}>
          Tallet på hvert krav er hvor mange aktive konsulenter som har den ferdigheten på CV-en, og
          merket er hvor mange som har treff på hvert må-krav. Et treff er et ord på CV-en, ikke et
          oppfylt krav; det sier hvem som finnes, ikke hvem som passer. Vurderingen gjør du på
          avropets side.
        </Typography>
      )}

      {/*
        Filters as chips, the order as a select. A filter on the AI is one of two states or none,
        so its two chips exclude each other; the coverage lights add up.
      */}
      {!requestId && (
        <Stack spacing={1.25} sx={{ mb: 1.5 }}>
          <Stack direction="row" spacing={0.75} useFlexGap flexWrap="wrap" alignItems="center">
            <FilterChip label="AI-vurdert" active={assessed === true} onClick={() => setAssessed(assessed === true ? null : true)} />
            <FilterChip label="Ikke AI-vurdert" active={assessed === false} onClick={() => setAssessed(assessed === false ? null : false)} />
            <Box sx={{ width: 1, borderLeft: 1, borderColor: 'divider', alignSelf: 'stretch', mx: 0.5 }} />
            {COVERAGE_FILTERS.map((f) => (
              <FilterChip key={f.status} label={f.label} active={coverage.includes(f.status)} onClick={() => toggleCoverage(f.status)} />
            ))}
            {filtering && (
              <Button size="small" onClick={() => { setAssessed(null); setCoverage([]); }} sx={{ textTransform: 'none' }}>
                Nullstill
              </Button>
            )}
          </Stack>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ sm: 'center' }} justifyContent="space-between">
            <Stack direction="row" spacing={1.5} alignItems="center">
              <FormControl size="small" sx={{ minWidth: 210 }}>
                <InputLabel id="matches-sort-label">Sortering</InputLabel>
                <Select
                  labelId="matches-sort-label"
                  label="Sortering"
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortValue)}
                >
                  {SORT_OPTIONS.map((o) => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
                </Select>
              </FormControl>
              {page && !loading && (
                <Typography variant="caption" color="text.secondary">
                  {page.totalElements} {page.totalElements === 1 ? 'avrop' : 'avrop'}{filtering ? ' med disse filtrene' : ''}
                </Typography>
              )}
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Typography variant="caption">Størrelse</Typography>
              <Button size="small" variant={pageSize === 10 ? 'contained' : 'outlined'} onClick={() => setPageSize(10)}>10</Button>
              <Button size="small" variant={pageSize === 20 ? 'contained' : 'outlined'} onClick={() => setPageSize(20)}>20</Button>
              <Button size="small" variant={pageSize === 50 ? 'contained' : 'outlined'} onClick={() => setPageSize(50)}>50</Button>
            </Stack>
          </Stack>
        </Stack>
      )}

      {!requestId && loading && (
        <Box sx={{ p: 4, textAlign: 'center' }}>
          <CircularProgress />
          <Typography variant="body2" sx={{ mt: 1 }}>Laster avrop…</Typography>
        </Box>
      )}

      {!requestId && !loading && rows.length === 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="body1">{filtering ? 'Ingen avrop passer filtrene.' : 'Ingen avrop funnet.'}</Typography>
        </Paper>
      )}

      {!requestId && (
        <Stack spacing={1}>
          {rows.map((pr, i) => (
            <RequestCard
              key={pr.id}
              pr={pr}
              muted={i % 2 === 1}
              onOpen={() => navigate(`/matches/${pr.id}`)}
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
