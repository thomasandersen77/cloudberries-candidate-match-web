import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useLocation, useParams } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Container, Stack } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew';
import AnalysisFailedAlert from '../../components/projectRequests/AnalysisFailedAlert';
import { getMatchRequest } from '../../services/matchesRequestsService';
import { getProjectRequestById } from '../../services/projectRequestsService';
import type { MatchesListItemDto, ProjectRequestResponseDto } from '../../types/api';
import RequestMatchPanel from '../../components/matches/RequestMatchPanel';

/**
 * The request's one page (plan C1, decided 2026-10-23): who, what, when and the one action at the
 * top, then the document and requirements, the candidates, the assessment and the proposals, in
 * the order the request's state calls for (C3). `/project-requests/{id}` redirects here; the upload
 * page stays where it is.
 *
 * It all sat in a card on the list, and then on two pages that each showed half of it.
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
  // Bumped after the request changed here («Prøv igjen», «Lukk avropet»), so it is read again.
  const [reloads, setReloads] = useState(0);

  useEffect(() => {
    if (!Number.isFinite(requestId)) return;
    let current = true;
    // A reload keeps what is on screen until the new answer comes; only a new request starts blank.
    if (reloads === 0) {
      setItem(undefined);
      setRequest(null);
    }
    getMatchRequest(requestId)
      .then((found) => { if (current) setItem(found); })
      .catch(() => { if (current) setItem(null); });
    // The requirements come from the request itself; the list row carries the coverage and the deadline.
    getProjectRequestById(requestId)
      .then((found) => { if (current) setRequest(found); })
      .catch(() => { if (current) setRequest(null); });
    return () => { current = false; };
  }, [requestId, reloads]);

  // A new request starts over at the first load.
  useEffect(() => setReloads(0), [requestId]);

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
        {request?.analysisStatus === 'FAILED' && (
          <AnalysisFailedAlert requestId={requestId} error={request.analysisError} onAnalysed={() => setReloads((n) => n + 1)} />
        )}
        {Number.isFinite(requestId) && (
          <RequestMatchPanel
            requestId={requestId}
            coverage={item?.coverage}
            layout="page"
            request={request}
            item={item}
            onRequestChanged={() => setReloads((n) => n + 1)}
          />
        )}
      </Stack>
    </Container>
  );
};

export default RequestMatchPage;
