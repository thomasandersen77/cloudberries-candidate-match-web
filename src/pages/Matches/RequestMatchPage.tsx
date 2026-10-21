import React, { useEffect, useState } from 'react';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { Alert, Box, Button, CircularProgress, Container, Paper, Stack, Typography } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew';
import { getMatchRequest } from '../../services/matchesRequestsService';
import type { MatchesListItemDto } from '../../types/api';
import RequestMatchPanel from '../../components/matches/RequestMatchPanel';
import HowMatchingWorks from '../../components/matches/HowMatchingWorks';
import { RequestCard } from './MatchesPage';

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
  const [item, setItem] = useState<MatchesListItemDto | null | undefined>(undefined);

  useEffect(() => {
    if (!Number.isFinite(requestId)) return;
    let current = true;
    setItem(undefined);
    getMatchRequest(requestId)
      .then((found) => { if (current) setItem(found); })
      .catch(() => { if (current) setItem(null); });
    return () => { current = false; };
  }, [requestId]);

  return (
    <Container sx={{ py: { xs: 2, md: 4 } }}>
      <Button component={RouterLink} to="/matches" size="small" startIcon={<ArrowBackIcon sx={{ fontSize: 14 }} />} sx={{ textTransform: 'none', mb: 2 }}>
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
