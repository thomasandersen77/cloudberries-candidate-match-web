import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation, useParams } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Container, Link, Paper, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew';
import { getMatchRequest } from '../../services/matchesRequestsService';
import { getProjectRequestById } from '../../services/projectRequestsService';
import type { MatchesListItemDto, ProjectRequestResponseDto, ProjectRequirementDto } from '../../types/api';
import RequestMatchPanel from '../../components/matches/RequestMatchPanel';
import HowMatchingWorks from '../../components/matches/HowMatchingWorks';
import { COARSE_POINTER, TOUCH_TARGET_PX } from '../../themeTokens';
import RequirementList from '../../components/matches/RequirementList';
import { RequestCard } from './MatchesPage';

const formatDate = (iso: string | null | undefined) => (iso ? new Date(iso).toLocaleDateString('nb-NO') : null);

/**
 * What the request asks for, in its own words: the summary, the period, and every requirement
 * with its priority and elaboration.
 *
 * The card above shows the technology requirements as chips with a count, which is coverage,
 * not the request. The must-haves the model scores against were only on the request's own page,
 * so judging an assessment meant reading it on another tab; here they sit between the card and
 * the assessment they explain.
 */
const RequestRequirements: React.FC<{ request: ProjectRequestResponseDto }> = ({ request }) => {
  const period = [formatDate(request.startDate), formatDate(request.endDate)].filter(Boolean);
  // The consultant's first: they are what the assessment under this is about. The supplier's
  // (submission format, deadlines) stay, marked, after them.
  const consultantFirst = (rows: ProjectRequirementDto[] | undefined) =>
    [...(rows ?? [])].sort((a, b) => Number(a.appliesTo === 'SUPPLIER') - Number(b.appliesTo === 'SUPPLIER'));
  const musts = consultantFirst(request.mustRequirements);
  const shoulds = consultantFirst(request.shouldRequirements);
  return (
    <Paper sx={{ p: 2 }}>
      <Stack direction="row" alignItems="baseline" justifyContent="space-between" spacing={1} sx={{ mb: 1 }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 600 }}>Avropet</Typography>
        {request.id != null && (
          <Link component={RouterLink} to={`/project-requests/${request.id}`} variant="body2" sx={{ fontWeight: 600, [COARSE_POINTER]: { display: 'inline-flex', alignItems: 'center', minHeight: TOUCH_TARGET_PX } }}>
            Åpne avropet
          </Link>
        )}
      </Stack>
      {period.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Periode {period.join(' – ')}
        </Typography>
      )}
      {request.summary && (
        <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: 1.5 }}>{request.summary}</Typography>
      )}
      <Stack direction={{ xs: 'column', md: 'row' }} spacing={1.5} alignItems="stretch">
        <RequirementList title="Må-krav" tone="warning" rows={musts} />
        <RequirementList title="Bør-krav" tone="info" rows={shoulds} />
      </Stack>
    </Paper>
  );
};

/**
 * One request, on its own page: the request and its coverage, how the matching works, the
 * AI assessment first and the preselection under it.
 *
 * It all sat in a card on the list, which could not tell an estimate from an assessment and
 * had no room for the requirement scores behind a total. The list is an overview now; this is
 * where the work is done.
 */
const RequestMatchPage: React.FC = () => {
  const { id } = useParams();
  const requestId = Number(id);
  // The list this page was opened from, with its filters and page; a plain /matches when the page
  // was reached by a link, a reload or the chat.
  const listSearch = (useLocation().state as { listSearch?: string } | null)?.listSearch;
  const backTo = listSearch ? `/matches?${listSearch}` : '/matches';
  const [item, setItem] = useState<MatchesListItemDto | null | undefined>(undefined);
  const [request, setRequest] = useState<ProjectRequestResponseDto | null>(null);

  useEffect(() => {
    if (!Number.isFinite(requestId)) return;
    let current = true;
    setItem(undefined);
    setRequest(null);
    getMatchRequest(requestId)
      .then((found) => { if (current) setItem(found); })
      .catch(() => { if (current) setItem(null); });
    // The requirements come from the request itself; the list row carries only the coverage.
    getProjectRequestById(requestId)
      .then((found) => { if (current) setRequest(found); })
      .catch(() => { if (current) setRequest(null); });
    return () => { current = false; };
  }, [requestId]);

  return (
    <Container sx={{ py: { xs: 2, md: 4 } }}>
      <Button component={RouterLink} to={backTo} size="small" startIcon={<ArrowBackIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: 'none', mb: 2 }}>
        Tilbake til matcher
      </Button>

      {item === undefined && (
        <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>
      )}
      {item === null && (
        <Alert severity="warning" sx={{ mb: 2 }}>Fant ikke avropet i matchlisten. Vurderingen under kan likevel kjøres.</Alert>
      )}

      <Stack spacing={2}>
        {item && <RequestCard pr={item} fullCoverage />}
        {request && <RequestRequirements request={request} />}
        <HowMatchingWorks />
        {Number.isFinite(requestId) && (
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" component="h2" sx={{ fontWeight: 600, mb: 1.5 }}>Vurdering</Typography>
            <RequestMatchPanel requestId={requestId} coverage={item?.coverage} layout="page" />
          </Paper>
        )}
      </Stack>
    </Container>
  );
};

export default RequestMatchPage;
