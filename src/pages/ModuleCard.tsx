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
import type { ModuleLink } from './modules';

const iconFor = (path: string) => {
  if (path.includes('consultants')) return <PeopleOutlineIcon sx={{ fontSize: 22 }} />;
  if (path.includes('skills')) return <PsychologyOutlinedIcon sx={{ fontSize: 22 }} />;
  if (path.includes('cv-score')) return <AssessmentOutlinedIcon sx={{ fontSize: 22 }} />;
  if (path.includes('matches')) return <HubOutlinedIcon sx={{ fontSize: 22 }} />;
  if (path.includes('embeddings')) return <HubOutlinedIcon sx={{ fontSize: 22 }} />;
  if (path.includes('project-requests')) return <UploadFileOutlinedIcon sx={{ fontSize: 22 }} />;
  if (path.includes('chat')) return <ChatOutlinedIcon sx={{ fontSize: 26 }} />;
  if (path.includes('health')) return <HealthAndSafetyOutlinedIcon sx={{ fontSize: 22 }} />;
  if (path.includes('stats')) return <BarChartOutlinedIcon sx={{ fontSize: 22 }} />;
  if (path.includes('semantic')) return <SearchOutlinedIcon sx={{ fontSize: 22 }} />;
  return <SearchOutlinedIcon sx={{ fontSize: 22 }} />;
};

/**
 * One module as a card, shared by the dashboard and the superuser page.
 *
 * Lifted out of the dashboard when the second page appeared. Copying forty lines of card markup is
 * how two lists of the same thing start looking like two different products.
 */
const ModuleCard: React.FC<React.PropsWithChildren<{ link: ModuleLink }>> = ({ link: l, children }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
        <Grid item xs={12} sm={l.featured ? 12 : 6} md={l.featured ? 12 : 4}>
          <Card
            elevation={0}
            sx={{
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              transition: 'transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease',
              border: `1px solid ${l.featured ? alpha(theme.palette.primary.main, 0.45) : theme.palette.divider}`,
              background: l.featured
                ? `linear-gradient(115deg, ${alpha(theme.palette.primary.main, 0.14)} 0%, transparent 65%)`
                : isDark
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
                <Stack direction="row" spacing={1} alignItems="center" sx={{ pr: 1 }}>
                  <Typography
                    variant={l.featured ? 'h5' : 'h6'}
                    sx={{ fontWeight: l.featured ? 700 : 600, letterSpacing: '-0.02em' }}
                  >
                    {l.title}
                  </Typography>
                  {l.featured && <Chip label="Start her" size="small" color="primary" />}
                </Stack>
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
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: children ? 2.5 : 3, flex: children ? 'none' : 1, lineHeight: 1.6 }}
              >
                {l.desc}
              </Typography>
              {/*
                Anything a card wants to say about itself before the way in. Only the assistant uses
                it, and it sat in a Paper of its own underneath: two boxes, no gap between them, and
                nothing saying the second belonged to the first.
              */}
              {children}
              <Button
                component={RouterLink}
                to={l.to}
                variant="contained"
                color="primary"
                fullWidth={!l.featured}
                size={l.featured ? 'large' : 'medium'}
                sx={{ mt: 'auto', alignSelf: l.featured ? 'flex-start' : undefined, px: l.featured ? 4 : undefined }}
              >
                {l.featured ? 'Åpne assistenten' : `Gå til ${l.title}`}
              </Button>
            </CardContent>
          </Card>
        </Grid>
  );
};

export default ModuleCard;
