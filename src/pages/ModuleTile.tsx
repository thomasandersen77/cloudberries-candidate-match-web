import React from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Card, CardActionArea, Typography } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import type { ModuleLink } from './modules';
import { moduleIcon } from './moduleIcon';

/**
 * One module as a compact tile for the front page: icon, title, one line, and the whole tile is
 * the link.
 *
 * The cards it replaces were each a heading, a sentence and a full-width button, stacked: six of
 * them took two screens on a laptop, and the button said nothing the title did not. A tile that
 * is itself the link is one target instead of two, and three fit on a row in the height one card
 * had. The superuser page keeps ModuleCard.
 */
const ModuleTile: React.FC<{ link: ModuleLink }> = ({ link }) => {
  const theme = useTheme();
  const isDark = theme.palette.mode === 'dark';

  return (
    <Card
      elevation={0}
      sx={{
        height: '100%',
        border: `1px solid ${theme.palette.divider}`,
        transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
        '&:hover': {
          borderColor: alpha(theme.palette.primary.main, 0.45),
          boxShadow: isDark ? '0 6px 24px rgba(0,0,0,0.35)' : '0 6px 24px rgba(17,17,17,0.07)',
        },
      }}
    >
      <CardActionArea component={RouterLink} to={link.to} sx={{ height: '100%', p: 1.25, display: 'flex', alignItems: 'center', gap: 1.5 }}>
        <Box
          aria-hidden
          sx={{
            flexShrink: 0,
            width: 40,
            height: 40,
            borderRadius: 2,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'primary.main',
            bgcolor: alpha(theme.palette.primary.main, isDark ? 0.16 : 0.08),
          }}
        >
          {moduleIcon(link.to)}
        </Box>
        <Box sx={{ minWidth: 0, flex: 1 }}>
          <Typography variant="subtitle1" component="h3" sx={{ fontWeight: 650, lineHeight: 1.3 }}>
            {link.title}
          </Typography>
          <Typography variant="body2" color="text.secondary" noWrap>
            {link.desc}
          </Typography>
        </Box>
        <ChevronRightIcon aria-hidden sx={{ color: 'text.disabled', flexShrink: 0 }} />
      </CardActionArea>
    </Card>
  );
};

export default ModuleTile;
