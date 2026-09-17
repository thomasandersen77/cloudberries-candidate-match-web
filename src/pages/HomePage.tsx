import React, { useEffect, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Grid, Card, CardContent, Typography, Button, Stack, Chip, useMediaQuery } from '@mui/material';
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
  // Rendered or not, rather than hidden with display: none, because a hidden first child still
  // takes the Stack's spacing and the title under it kept a blank line where the chip was.
  const isPhone = useMediaQuery(theme.breakpoints.down('sm'));
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
    // "End-to-end" stood here in a Norwegian interface. The fact is the same.
    { label: 'Arbeidsflyt', value: 'Søk til forslag', helper: 'Alt i én arbeidsflate' },
  ];

  return (
    <Box sx={{ py: { xs: 1, md: 4 } }}>
      <Card
        sx={{
          mb: { xs: 2, md: 5 },
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
        <CardContent sx={{ p: { xs: 2, md: 4 }, position: 'relative' }}>
          <Stack spacing={2} sx={{ maxWidth: 860 }}>
            {/* The header already carries the brand; on a phone the chip is a line the title needs more. */}
            {!isPhone && (
              <Chip
                label={heroBrandLabel}
                size="small"
                sx={{ width: 'fit-content', fontWeight: 600, bgcolor: alpha(theme.palette.primary.main, 0.12) }}
              />
            )}
            {/*
              Smaller on a phone. At h4 the title is four lines of 390 px, and the whole point of
              the front page on a phone is that the modules are reachable without a scroll of three
              screens; e2e/home.spec.ts measures where the first module card lands.
            */}
            <Typography
              variant="h4"
              component="h1"
              sx={{ fontWeight: 700, letterSpacing: '-0.03em', maxWidth: 920, fontSize: { xs: '1.45rem', sm: '1.8rem', md: '2.125rem' } }}
            >
              Intelligent arbeidsflate for kompetansesøk, kvalitetsvurdering og AI-drevet matching
            </Typography>
            <Typography
              variant="body1"
              color="text.secondary"
              sx={{ fontSize: { xs: '0.95rem', md: '1.03rem' }, lineHeight: { xs: 1.55, md: 1.68 }, maxWidth: 800 }}
            >
              Spør assistenten på vanlig norsk: hvem kan Java og Kotlin, hva krever avropet fra
              Skatteetaten, hvem passer best til det.{' '}
              {/* The middle of the paragraph is desktop reading; the promise at the end stays everywhere. */}
              <Box component="span" sx={{ display: { xs: 'none', md: 'inline' } }}>
                Søket rangerer på dokumentert erfaring i CV-ene, kravene leses ut av
                kundeforespørselen, og svaret viser kildene sine, så du kan kontrollere det mot
                CV-en eller avropet.{' '}
              </Box>
              Står det ikke i basen, sier assistenten det i stedet for å gjette.
            </Typography>
          </Stack>
          {/*
            One row of three on every width. Stacked on a phone, the three were three cards of
            their own before the modules, and two of them are not even numbers. On xs they keep
            the label and the fact and drop the helper line; from sm up they read as before.
          */}
          <Grid container spacing={{ xs: 1, sm: 2 }} sx={{ mt: { xs: 0, sm: 0.5 } }}>
            {kpis.map((kpi) => (
              <Grid item xs={4} key={kpi.label}>
                <Box
                  sx={{
                    borderRadius: 3,
                    px: { xs: 1, sm: 2 },
                    py: { xs: 1, sm: 1.75 },
                    // Centred, because the three sit side by side under a paragraph that is not:
                    // left-aligned inside their own boxes they read as three ragged columns rather
                    // than as one row of figures.
                    textAlign: 'center',
                    height: '100%',
                    bgcolor: isDark ? alpha('#fff', 0.04) : alpha('#fff', 0.8),
                    border: `1px solid ${alpha(theme.palette.divider, 0.75)}`,
                  }}
                >
                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ textTransform: 'uppercase', letterSpacing: { xs: '0.04em', sm: '0.08em' }, fontSize: { xs: '0.65rem', sm: '0.75rem' } }}
                  >
                    {kpi.label}
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.25, fontSize: { xs: '0.95rem', sm: '1.25rem' }, lineHeight: 1.3 }}>
                    {kpi.value}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ display: { xs: 'none', sm: 'block' } }}>
                    {kpi.helper}
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </CardContent>
      </Card>

      <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: { xs: 1.5, md: 2 } }}>
        <Typography variant="h6" sx={{ fontWeight: 650 }}>
          Moduloversikt
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Velg arbeidsområde
        </Typography>
      </Stack>

      <Grid container spacing={{ xs: 2, md: 2.5 }}>
        {links.filter(l => l.featured).map((l) => (
          // Inside the card, because it is the card's own claim it explains. Folded, because open
          // it was most of the page on a phone; the assistant page shows the whole of it.
          <ModuleCard key={l.to} link={l}>
            <HowTheAssistantAnswers collapsible />
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
