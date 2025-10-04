import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { clamp, getScoreColor } from '../utils/scoreUtils';

interface CvScoreBadgeProps {
  score: number | null | undefined;
  size?: 'sm' | 'md' | 'lg';
  sizePx?: number; // overrides size mapping when provided
  thickness?: number;
  subLabel?: string; // optional small label under the number (inside the ring)
  ariaLabel?: string;
}

const sizeToPx: Record<NonNullable<CvScoreBadgeProps['size']>, number> = {
  sm: 32,
  md: 40,
  lg: 44,
};

const sizeToFont: Record<NonNullable<CvScoreBadgeProps['size']>, string> = {
  sm: '0.65rem',
  md: '0.8rem',
  lg: '0.9rem',
};

const CvScoreBadge: React.FC<CvScoreBadgeProps> = ({
  score,
  size = 'md',
  sizePx,
  thickness = 4,
  subLabel,
  ariaLabel,
}) => {
  const hasScore = typeof score === 'number' && !Number.isNaN(score);
  const pct = hasScore ? clamp(score as number, 0, 100) : 0;
  const px = sizePx ?? sizeToPx[size];
  const fontSize = sizeToFont[size];
  const color = hasScore ? getScoreColor(pct) : undefined;

  const label = ariaLabel ?? (hasScore ? `CV score ${pct} av 100` : 'CV score ikke tilgjengelig');

  return (
    <Box sx={{ position: 'relative', display: 'inline-flex' }} aria-label={label}>
      <CircularProgress
        variant="determinate"
        value={pct}
        size={px}
        thickness={thickness}
        sx={{ color: color, opacity: hasScore ? 1 : 0.3 }}
      />
      <Box
        sx={{
          top: 0,
          left: 0,
          bottom: 0,
          right: 0,
          position: 'absolute',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 'bold', fontSize, color: color }}>
          {hasScore ? `${pct}%` : '—'}
        </Typography>
        {subLabel && (
          <Typography variant="caption" sx={{ fontSize: '0.6rem', lineHeight: 1, color: color }}>
            {subLabel}
          </Typography>
        )}
      </Box>
    </Box>
  );
};

export default CvScoreBadge;