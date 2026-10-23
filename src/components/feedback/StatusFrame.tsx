import React from 'react';
import { Box, Typography } from '@mui/material';
import { alpha } from '@mui/material/styles';
import type { SvgIconComponent } from '@mui/icons-material';

export type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

type StatusFrameProps = {
  tone: StatusTone;
  Icon: SvgIconComponent;
  /** The answer, in words: the frame must read without its colour. */
  label: string;
  /** What the frame is about («Krav», «AI-vurdering»), above the label; the list card leaves it out. */
  title?: string;
  /** Anything under the label, such as a progress bar. */
  children?: React.ReactNode;
};

/**
 * One status in a frame: a thin border and a tint in its colour, the words in the same colour
 * (plan E4). The list card's coverage and AI status, and the request page's requirements, coverage
 * and assessment, are drawn with this alike, the same size and face, so the eye reads them as
 * answers to separate questions and compares them. Each state keeps its own frame: the analysis,
 * the run and the freshness are not forced into one enum to share a look.
 */
const StatusFrame: React.FC<StatusFrameProps> = ({ tone, Icon, label, title, children }) => (
  <Box
    sx={(theme) => {
      const main = tone === 'neutral' ? theme.palette.text.secondary : tone === 'info' ? theme.palette.primary.main : theme.palette[tone].main;
      return {
        display: 'flex',
        alignItems: title ? 'flex-start' : 'center',
        gap: 0.75,
        px: 1.25,
        py: title ? 1 : 0.625,
        borderRadius: 2,
        border: `1.5px solid ${alpha(main, tone === 'neutral' ? 0.5 : 0.7)}`,
        backgroundColor: alpha(main, theme.palette.mode === 'dark' ? 0.12 : 0.06),
        color: main,
        fontWeight: 700,
        fontSize: '0.875rem',
        lineHeight: 1.3,
        // One line where there is room on the list card; on a phone the label wraps, since «1 har
        // treff på alle må-krav · 7 mangler ett» on one line pushed the card 60 px past 390 px.
        whiteSpace: title ? 'normal' : { xs: 'normal', sm: 'nowrap' },
        minWidth: 0,
      };
    }}
  >
    <Icon sx={{ fontSize: 17, flexShrink: 0, mt: title ? 0.25 : 0 }} />
    <Box sx={{ minWidth: 0, flex: 1 }}>
      {title && (
        <Typography component="div" sx={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', color: 'inherit' }}>
          {title}
        </Typography>
      )}
      <Box component="span" sx={{ fontWeight: title ? 500 : 700, display: 'block' }}>{label}</Box>
      {children}
    </Box>
  </Box>
);

export default StatusFrame;
