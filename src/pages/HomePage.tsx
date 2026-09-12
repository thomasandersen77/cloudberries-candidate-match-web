import React, { useEffect, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Grid, Card, CardContent, Typography, Button, Stack, Chip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import TuneOutlinedIcon from '@mui/icons-material/TuneOutlined';
import { useColorMode } from '../theme';
import { BRANDING } from '../config/branding';
import { listConsultantsWithCvPaged } from '../services/consultantsService';
import { EVERYDAY_MODULES, SUPERUSER_MODULES } from './modules';
import ModuleCard from './ModuleCard';
import HowTheAssistantAnswers from './HowTheAssistantAnswers';

const HomePage: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { brandTheme } = useColorMode();
  const brand = BRANDING[brandTheme] ?? BRANDING.cloudberries;
  const heroBrandLabel = `${brand.displayName} Candidate Match`;

  const links = EVERYDAY_MODULES;

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

  const kpis = [
    {
      label: 'Konsulenter',
      value: consultantCount === null ? '–' : String(consultantCount),
      helper: 'Med aktiv CV i basen'
    },
    { label: 'Assistent', value: 'Svar med kilder', helper: 'Siterer CV-en eller avropet' },
    { label: 'Arbeidsflyt', value: 'End-to-end', helper: 'Fra søk til prosjektforslag' },
  ];

  return (
    <Box sx={{ py: { xs: 2, md: 4 } }}>
      <Card
        sx={{
          mb: { xs: 3, md: 5 },
          overflow: 'hidden',
          position: 'relative',
          borderColor: alpha(theme.palette.primary.main, 0.26),
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            background: `linear-gradient(115deg, ${alpha(theme.palette.primary.main, 0.22)} 0%, transparent 40%, ${alpha(
              theme.palette.secondary.main,
              0.1
            )} 100%)`,
          }}
        />
        <CardContent sx={{ p: { xs: 3, md: 4 }, position: 'relative' }}>
          <Stack spacing={2} sx={{ maxWidth: 860 }}>
            <Chip
              label={heroBrandLabel}
              size="small"
              sx={{ width: 'fit-content', fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.12) }}
            />
            <Typography variant="h4" component="h1" sx={{ fontWeight: 700, letterSpacing: '-0.03em', maxWidth: 920 }}>
              Intelligent arbeidsflate for kompetansesøk, kvalitetsvurdering og AI-drevet matching
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.03rem', lineHeight: 1.68, maxWidth: 800 }}>
              Spør assistenten på vanlig norsk: hvem kan Java og Kotlin, hva krever avropet fra
              Skatteetaten, hvem passer best til det. Søket rangerer på dokumentert erfaring i
              CV-ene, kravene leses ut av kundeforespørselen, og hver påstand viser hvilken CV eller
              hvilket avrop den kommer fra. Står det ikke i basen, sier assistenten det i stedet for
              å gjette.
            </Typography>
          </Stack>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {kpis.map((kpi) => (
              <Grid item xs={12} sm={4} key={kpi.label}>
                <Box
                  sx={{
                    borderRadius: 3,
                    px: 2,
                    py: 1.75,
                    // Centred, because the three sit side by side under a paragraph that is not:
                    // left-aligned inside their own boxes they read as three ragged columns rather
                    // than as one row of figures.
                    textAlign: 'center',
                    height: '100%',
                    bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#fff', 0.8),
                    border: `1px solid ${alpha(theme.palette.divider, 0.75)}`,
                  }}
                >
                  <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {kpi.label}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.25 }}>
                    {kpi.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {kpi.helper}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 650 }}>
          Moduloversikt
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Velg arbeidsområde
        </Typography>
      </Stack>

      <Grid container spacing={{ xs: 2, md: 2.5 }}>
        {links.filter(l => l.featured).map((l) => (
          // Inside the card, because it is the card's own claim it explains.
          <ModuleCard key={l.to} link={l}>
            <HowTheAssistantAnswers />
          </ModuleCard>
        ))}
      </Grid>

      <Grid container spacing={{ xs: 2, md: 2.5 }} sx={{ mt: { xs: 2, md: 3 } }}>
        {links.filter(l => !l.featured).map((l) => (
          <ModuleCard key={l.to} link={l} />
        ))}
      </Grid>

      {/*
        Nothing is hidden, only moved. The modules here are batch jobs and narrower ways into data
        the cards above already show, and listing them as equals said they were equally often the
        right thing to click.
      */}
      <Stack direction="row" justifyContent="center" sx={{ mt: 4 }}>
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
