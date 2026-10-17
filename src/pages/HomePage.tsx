import React, { useEffect, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Grid, Typography, Button, Stack } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import { listConsultantsWithCvPaged } from '../services/consultantsService';
import { EVERYDAY_MODULES, SUPERUSER_MODULES } from './modules';
import ModuleTile from './ModuleTile';
import AssistantHero from './AssistantHero';

/**
 * The front page, on one screen.
 *
 * It was four layers deep: a hero with a tagline, a paragraph and three boxes, then the assistant
 * as a card whose explanation opened into four paragraphs, then a heading, then six cards with a
 * button each. On a laptop the last row was a scroll away, and the hero said most of what the
 * assistant card said again. Now the tagline is one line with the one live figure beside it, the
 * assistant carries the page, and the other modules are tiles under a line saying what they are
 * for. Nothing that was a fact is gone: the consultant count, that answers show their sources, and
 * that the assistant says so when the base has nothing. "Søk til forslag" was a slogan.
 */
const HomePage: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  /**
   * The size of the database, read from it.
   *
   * It said "111+" for as long as it took somebody to notice, while the base held 118. A number
   * written into a page is a number that is wrong the first time anybody syncs, and this one is the
   * first thing a reader sees. Null until it loads, and null if the call fails: a dash is honest
   * where a stale figure is not.
   */
  const [consultantCount, setConsultantCount] = useState<number | null>(null);

  useEffect(() => {
    listConsultantsWithCvPaged({ page: 0, size: 1, onlyActiveCv: true })
      .then(page => setConsultantCount(page.totalElements ?? null))
      .catch(() => setConsultantCount(null));
  }, []);

  const others = EVERYDAY_MODULES.filter(l => !l.featured);

  return (
    <Box sx={{ py: { xs: 1, md: 1.5 } }}>
      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={{ xs: 1.5, sm: 3 }}
        alignItems={{ sm: 'flex-end' }}
        justifyContent="space-between"
        sx={{ mb: { xs: 2, md: 2 } }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 700, letterSpacing: '-0.03em', fontSize: { xs: '1.4rem', sm: '1.7rem', md: '1.95rem' }, lineHeight: 1.2 }}
          >
            Intelligent kompetansesøk og AI-drevet matching
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.5 }}>
            Finn konsulenter på dokumentert erfaring, vurder CV-kvalitet og match mot kundeforespørsler.
          </Typography>
        </Box>
        <Box
          sx={{
            flexShrink: 0,
            px: 2,
            py: 1,
            borderRadius: 2,
            border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
            bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#fff', 0.8),
            textAlign: { xs: 'left', sm: 'right' },
          }}
        >
          <Typography variant="h5" component="p" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
            {consultantCount === null ? '–' : consultantCount}
          </Typography>
          <Typography variant="caption" color="text.secondary">Konsulenter med aktiv CV</Typography>
        </Box>
      </Stack>

      <AssistantHero />

      <Box sx={{ mt: { xs: 3, md: 2.5 }, mb: 1.25 }}>
        <Typography variant="h6" component="h2" sx={{ fontWeight: 650 }}>
          Andre arbeidsflater
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Konsulentlisten, matching mot avrop, opplasting av nye forespørsler og oversikter.
        </Typography>
      </Box>

      <Grid container spacing={{ xs: 1.5, md: 2 }}>
        {others.map(l => (
          <Grid item xs={12} sm={6} md={4} key={l.to}>
            <ModuleTile link={l} />
          </Grid>
        ))}
      </Grid>

      {/*
        Nothing is hidden, only moved. The modules here are batch jobs and narrower ways into data
        the tiles above already show, and listing them as equals said they were equally often the
        right thing to click.
      */}
      <Stack direction="row" justifyContent="center" sx={{ mt: { xs: 2, md: 1.5 } }}>
        <Button
          component={RouterLink}
          to="/superbruker"
          variant="text"
          size="small"
          startIcon={<TuneOutlinedIcon sx={{ fontSize: 18 }} />}
          sx={{ textTransform: 'none' }}
        >
          Superbruker: {SUPERUSER_MODULES.map(m => m.title).join(', ')}
        </Button>
      </Stack>
    </Box>
  );
};

export default HomePage;
