import React from 'react';
import { Box, Grid, Typography, Button, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew';
import { SUPERUSER_MODULES } from './modules';
import ModuleCard from './ModuleCard';

/**
 * The modules a working day does not usually touch.
 *
 * They were on the dashboard beside the everyday ones, which said they were equally often the right
 * thing to click. Embeddings runs a batch job that rebuilds what semantic search reads; Ferdigheter
 * and Søk are narrower ways into what the assistant and the consultant list already answer. All
 * three are still here, still routed, and still reachable from the dashboard.
 */
const SuperuserPage: React.FC = () => (
  <Box sx={{ py: { xs: 2, md: 4 } }}>
    <Button
      component={RouterLink}
      to="/"
      size="small"
      startIcon={<ArrowBackIcon sx={{ fontSize: 14 }} />}
      sx={{ textTransform: 'none', mb: 2 }}
    >
      Tilbake til dashbordet
    </Button>

    <Stack spacing={1} sx={{ mb: 3, maxWidth: 720 }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, letterSpacing: '-0.03em' }}>
        Superbruker
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.68 }}>
        Verktøy for drift og for den som vil inn i datagrunnlaget direkte. Embeddings bygger om det
        semantiske søket leser fra, og de to andre er smalere innganger til det assistenten og
        konsulentlisten allerede svarer på.
      </Typography>
    </Stack>

    <Grid container spacing={{ xs: 2, md: 2.5 }}>
      {SUPERUSER_MODULES.map(link => (
        <ModuleCard key={link.to} link={link} />
      ))}
    </Grid>
  </Box>
);

export default SuperuserPage;
