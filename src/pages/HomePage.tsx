import React from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Grid, Card, CardContent, Typography, Button, Stack, Chip } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import PeopleOutlineIcon from '@mui/icons-material/PeopleOutline';
import PsychologyOutlinedIcon from '@mui/icons-material/PsychologyOutlined';
import AssessmentOutlinedIcon from '@mui/icons-material/AssessmentOutlined';
import HubOutlinedIcon from '@mui/icons-material/HubOutlined';
import UploadFileOutlinedIcon from '@mui/icons-material/UploadFileOutlined';
import ChatOutlinedIcon from '@mui/icons-material/ChatOutlined';
import HealthAndSafetyOutlinedIcon from '@mui/icons-material/HealthAndSafetyOutlined';
import BarChartOutlinedIcon from '@mui/icons-material/BarChartOutlined';
import SearchOutlinedIcon from '@mui/icons-material/SearchOutlined';
import { useColorMode } from '../theme';
import { BRANDING } from '../config/branding';

const iconFor = (path: string) => {
  if (path.includes('consultants')) return <PeopleOutlineIcon sx={{ fontSize: 22 }} />;
  if (path.includes('skills')) return <PsychologyOutlinedIcon sx={{ fontSize: 22 }} />;
  if (path.includes('cv-score')) return <AssessmentOutlinedIcon sx={{ fontSize: 22 }} />;
  if (path.includes('matches')) return <HubOutlinedIcon sx={{ fontSize: 22 }} />;
  if (path.includes('embeddings')) return <HubOutlinedIcon sx={{ fontSize: 22 }} />;
  if (path.includes('project-requests')) return <UploadFileOutlinedIcon sx={{ fontSize: 22 }} />;
  if (path.includes('chat')) return <ChatOutlinedIcon sx={{ fontSize: 22 }} />;
  if (path.includes('health')) return <HealthAndSafetyOutlinedIcon sx={{ fontSize: 22 }} />;
  if (path.includes('stats')) return <BarChartOutlinedIcon sx={{ fontSize: 22 }} />;
  if (path.includes('semantic')) return <SearchOutlinedIcon sx={{ fontSize: 22 }} />;
  return <SearchOutlinedIcon sx={{ fontSize: 22 }} />;
};

const HomePage: React.FC = () => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';
  const { brandTheme } = useColorMode();
  const brand = BRANDING[brandTheme] ?? BRANDING.cloudberries;
  const heroBrandLabel = `${brand.displayName} Candidate Match`;

  const links = [
    { to: '/consultants', title: 'Konsulenter', desc: 'Se liste over konsulenter og CV-kvalitet' },
    { to: '/skills', title: 'Ferdigheter', desc: 'Oversikt over ferdigheter og tilknyttede konsulenter' },
    { to: '/cv-score', title: 'CV-Score', desc: 'Analyser og sammenlign kandidat-CV-er' },
    { to: '/matches', title: 'Matcher', desc: 'Finn kandidatmatcher mot prosjekter' },
    { to: '/embeddings', title: 'Embeddings', desc: 'Kjør embedding-oppgaver' },
    { to: '/project-requests/upload', title: 'Last opp kundeforspørsel', desc: 'PDF, AI-analyse og lagring i databasen' },
    { to: '/chat', title: 'Chat Analyze', desc: 'Analyser tekst med AI' },
    { to: '/health', title: 'Helse', desc: 'Systemstatus og tilgjengelighet' },
    { to: '/stats', title: 'Statistikk', desc: 'Programmeringsspråk og roller' },
    { to: '/search', title: 'Søk', desc: 'Søk i konsulenter og kompetanse' },
  ];

  const kpis = [
    { label: 'Konsulenter', value: '111+', helper: 'Live kandidatbase' },
    { label: 'Scoring', value: 'AI-first', helper: 'CV, match og kvalitet' },
    { label: 'Arbeidsflyt', value: 'End-to-end', helper: 'Søk til prosjektforslag' },
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
              Premium arbeidsflate for kompetansesøk, kvalitetsvurdering og AI-drevet matching
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ fontSize: '1.03rem', lineHeight: 1.68, maxWidth: 800 }}>
              Bygget for moderne konsulenthus: rask innsikt i kompetanse, bedre match mot kundeforspørsler og tryggere beslutninger
              basert på data, kontekst og kvalitetssikret AI.
            </Typography>
          </Stack>
          <Grid container spacing={2} sx={{ mt: 0.5 }}>
            {kpis.map((kpi) => (
              <Grid item xs={12} sm={4} key={kpi.label}>
                <Box
                  sx={{
                    borderRadius: 3,
                    px: 2,
                    py: 1.5,
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
        {links.map((l) => (
          <Grid item xs={12} sm={6} md={4} key={l.to}>
            <Card
              elevation={0}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
                border: `1px solid ${theme.palette.divider}`,
                background: isDark
                  ? `linear-gradient(180deg, ${alpha('#fff', 0.015)} 0%, transparent 100%)`
                  : `linear-gradient(180deg, ${alpha(theme.palette.primary.main, 0.035)} 0%, transparent 100%)`,
                '&:hover': {
                  transform: 'translateY(-2px)',
                  boxShadow: isDark
                    ? '0 12px 40px rgba(0,0,0,0.35)'
                    : '0 12px 40px rgba(17,17,17,0.08)',
                  borderColor: alpha(theme.palette.primary.main, 0.35),
                },
              }}
            >
              <CardContent sx={{ p: 3, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.02em', pr: 1 }}>
                    {l.title}
                  </Typography>
                  <Box
                    sx={{
                      color: 'text.secondary',
                      opacity: 0.85,
                      flexShrink: 0,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 40,
                      height: 40,
                      borderRadius: 2,
                      bgcolor: isDark ? alpha('#fff', 0.06) : alpha('#111111', 0.04),
                    }}
                    aria-hidden
                  >
                    {iconFor(l.to)}
                  </Box>
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3, flex: 1, lineHeight: 1.6 }}>
                  {l.desc}
                </Typography>
                <Button component={RouterLink} to={l.to} variant="contained" color="primary" fullWidth sx={{ mt: 'auto' }}>
                  Gå til {l.title}
                </Button>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default HomePage;
