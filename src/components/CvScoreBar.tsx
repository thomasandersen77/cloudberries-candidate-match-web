import React from 'react';
import { Box, Tooltip, Typography, useTheme } from '@mui/material';
import { clamp } from '../utils/scoreUtils';
import { SEGMENTS, segmentFill } from './cvScoreBarSegments';

interface CvScoreBarProps {
  score: number | null | undefined;
  /** Square size in px. */
  square?: number;
}

/**
 * A CV quality score as a ten-square bar, 0 to 100, with the number beside it.
 *
 * Replaced the ring on the consultant list, which read as a gauge without a scale: a ring at 84 and
 * a ring at 80 look alike, and nothing on it says where zero and a hundred are. Here the squares
 * are the scale, the green is how far up it a CV reaches, and the ends are labelled.
 */
const CvScoreBar: React.FC<CvScoreBarProps> = ({ score, square = 10 }) => {
  const theme = useTheme();
  const hasScore = typeof score === 'number' && !Number.isNaN(score);
  if (!hasScore) {
    return <Typography variant="body2" color="text.secondary">-</Typography>;
  }

  const pct = Math.round(clamp(score as number, 0, 100));
  const green = theme.palette.success.main;
  const empty = theme.palette.mode === 'dark' ? theme.palette.grey[700] : theme.palette.grey[300];
  const gap = 2;
  const width = SEGMENTS * square + (SEGMENTS - 1) * gap;
  const label = `CV-skår ${pct} av 100`;

  return (
    <Tooltip title={label}>
      <Box sx={{ display: 'inline-flex', flexDirection: 'column', width }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', mb: 0.25 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>CV-skår</Typography>
          <Typography variant="caption" sx={{ fontWeight: 700, fontSize: '0.8rem' }}>{pct} %</Typography>
        </Box>
        <Box
          role="meter"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={pct}
          sx={{ display: 'flex', gap: `${gap}px` }}
        >
          {segmentFill(pct).map((fill, i) => (
            <Box
              key={i}
              data-fill={fill}
              sx={{
                width: square,
                height: square,
                borderRadius: '2px',
                // Green up to the score, light grey beyond it, inside the same square.
                background: `linear-gradient(to right, ${green} ${fill * 100}%, ${empty} ${fill * 100}%)`,
              }}
            />
          ))}
        </Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 0.25 }}>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem', lineHeight: 1 }}>0</Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.55rem', lineHeight: 1 }}>100</Typography>
        </Box>
      </Box>
    </Tooltip>
  );
};

export default CvScoreBar;
