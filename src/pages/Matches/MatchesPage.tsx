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
import type { CoverageStatus, MatchesListItemDto, PagedMatchesListDto, WorkStatus } from '../../types/api';
import StatusFrame, { type StatusTone } from '../../components/feedback/StatusFrame';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
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
          {/* In words, not colour alone: a passed deadline, a closed request, a document not read. */}
          {(pr.workStatus === 'DEADLINE_PASSED' || pr.workStatus === 'CLOSED' || pr.analysisStatus === 'FAILED') && (
            <Stack direction="row" spacing={1} sx={{ mt: 0.5 }} useFlexGap flexWrap="wrap">
              {pr.workStatus === 'DEADLINE_PASSED' && (
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'warning.main' }}>Frist passert</Typography>
              )}
              {pr.workStatus === 'CLOSED' && (
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary' }}>Lukket</Typography>
              )}
              {pr.analysisStatus === 'FAILED' && (
                <Typography variant="caption" sx={{ fontWeight: 700, color: 'error.main' }}>Kravtolking feilet</Typography>
              )}
            </Stack>
          )}
        </Box>

        {/*
          Two answers in two frames of one size: does the corpus cover it, and has the model been
          run. Green and orange for the AI because the reader asked for a verdict, not a count.
        */}
        <Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0, width: { xs: '100%', sm: 'auto' } }}>
          <Stack spacing={0.75} sx={{ minWidth: { xs: 0, sm: 236 }, flex: { xs: 1, sm: 'none' } }}>
            <StatusFrame tone={style.tone} Icon={style.Icon} label={pr.coverageLabel} />
            <StatusFrame
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
              // 44 px on a phone, where it is a thumb and not a pointer.
              sx={{ width: { xs: 44, sm: 34 }, height: { xs: 44, sm: 34 } }}
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

const PAGE_SIZES = [10, 20, 50] as const;
const SORT_VALUES = SORT_OPTIONS.map((o) => o.value);
const COVERAGE_VALUES = COVERAGE_FILTERS.map((f) => f.status);

/** Where the request is in the work (plan C8), from its status and its response deadline. */
const WORK_FILTERS: { status: WorkStatus; label: string }[] = [
  { status: 'ACTIVE', label: 'Aktive' },
  { status: 'DEADLINE_PASSED', label: 'Frist passert' },
  { status: 'CLOSED', label: 'Lukket' },
];
const WORK_VALUES = WORK_FILTERS.map((f) => f.status);

/**
 * The list's order, filters, page and page size live in the URL, not in component state.
 *
 * They were state, so opening a request and coming back reset them: «AI-vurdert» narrowed the
 * list to seven, the request page opened, «Tilbake til matcher» showed twenty-seven. Read from
 * the URL on every render, written with `replace` so the browser's back button still leaves
 * the list rather than stepping through its filters. Anything the URL holds that the page does
 * not understand falls back to the default rather than reaching the server.
 */
type ListQuery = { sort: SortValue; assessed: boolean | null; coverage: CoverageStatus[]; work: WorkStatus[]; pageIndex: number; pageSize: number };

function readQuery(params: URLSearchParams): ListQuery {
  const sort = params.get('sort');
  const assessed = params.get('assessed');
  const size = Number(params.get('size'));
  const pageIndex = Number(params.get('page'));
  return {
    sort: (SORT_VALUES as string[]).includes(sort ?? '') ? (sort as SortValue) : 'date,desc',
    assessed: assessed === 'true' ? true : assessed === 'false' ? false : null,
    coverage: (params.get('coverage') ?? '').split(',').filter((c): c is CoverageStatus => (COVERAGE_VALUES as string[]).includes(c)),
    work: (params.get('work') ?? '').split(',').filter((w): w is WorkStatus => (WORK_VALUES as string[]).includes(w)),
    pageIndex: Number.isInteger(pageIndex) && pageIndex > 0 ? pageIndex : 0,
    pageSize: (PAGE_SIZES as readonly number[]).includes(size) ? size : 20,
  };
}

/** Only what differs from the default, so the plain `/matches` stays plain. */
function writeQuery(q: ListQuery): URLSearchParams {
  const params = new URLSearchParams();
  if (q.sort !== 'date,desc') params.set('sort', q.sort);
  if (q.assessed !== null) params.set('assessed', String(q.assessed));
  if (q.coverage.length > 0) params.set('coverage', q.coverage.join(','));
  if (q.work.length > 0) params.set('work', q.work.join(','));
  if (q.pageIndex > 0) params.set('page', String(q.pageIndex));
  if (q.pageSize !== 20) params.set('size', String(q.pageSize));
  return params;
}

const MatchesPage: React.FC = () => {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const requestIdParam = params.get('requestId');
  const requestId = requestIdParam ? Number(requestIdParam) : null;
  const query = useMemo(() => readQuery(params), [params]);
  const { sort, assessed, coverage, work, pageIndex, pageSize } = query;

  const [page, setPage] = useState<PagedMatchesListDto | null>(null);
  const [loading, setLoading] = useState(true);
  const filtering = assessed !== null || coverage.length > 0 || work.length > 0;

  // Any change to the order, the filters or the size starts over from the first page.
  const update = (change: Partial<ListQuery>) =>
    setParams(writeQuery({ ...query, pageIndex: 0, ...change }), { replace: true });
  const setSort = (value: SortValue) => update({ sort: value });
  const setAssessed = (value: boolean | null) => update({ assessed: value });
  const setPageSize = (value: number) => update({ pageSize: value });
  const toggleCoverage = (status: CoverageStatus) =>
    update({ coverage: coverage.includes(status) ? coverage.filter((s) => s !== status) : [...coverage, status] });
  const toggleWork = (status: WorkStatus) =>
    update({ work: work.includes(status) ? work.filter((s) => s !== status) : [...work, status] });
  const loadPage = (index: number) => update({ pageIndex: index });

  useEffect(() => {
    if (requestId) return;
    let current = true;
    setLoading(true);
    listMatchRequests({ page: pageIndex, size: pageSize, sort, assessed, coverage, work })
      .then((p) => { if (current) setPage(p); })
      .finally(() => { if (current) setLoading(false); });
    return () => { current = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [requestId, pageIndex, pageSize, sort, assessed, coverage.join(','), work.join(',')]);

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
            <Box sx={{ width: 1, borderLeft: 1, borderColor: 'divider', alignSelf: 'stretch', mx: 0.5 }} />
            {WORK_FILTERS.map((f) => (
              <FilterChip key={f.status} label={f.label} active={work.includes(f.status)} onClick={() => toggleWork(f.status)} />
            ))}
            {filtering && (
              <Button size="small" onClick={() => update({ assessed: null, coverage: [], work: [] })} sx={{ textTransform: 'none' }}>
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
              // The list's query goes along, so «Tilbake til matcher» lands on the same list.
              onOpen={() => navigate(`/matches/${pr.id}`, { state: { listSearch: params.toString() } })}
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
