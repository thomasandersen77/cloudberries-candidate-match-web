import React, { useLayoutEffect, useRef, useState } from 'react';
import { Box, Button, Typography, Paper } from '@mui/material';
import type { KeyQualificationDto } from '../../types/api';

const TITLE = 'Sammendrag';

interface CvSummaryProps {
  keyQualifications: KeyQualificationDto[];
  /**
   * Show at most this many lines of each description, with "Vis mer" for the rest. The detail
   * page passes 4: the median summary is 1277 characters, eight or nine lines, and one is 4102.
   * The full CV page leaves it out and shows everything.
   */
  clampLines?: number;
}

const CvSummary: React.FC<CvSummaryProps> = ({ keyQualifications, clampLines }) => {
  if (!keyQualifications || keyQualifications.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.01em', mb: 2 }}>
          {TITLE}
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ingen nøkkelkvalifikasjoner tilgjengelig
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.01em', mb: 2 }}>
        {TITLE}
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {keyQualifications.map((qualification, index) => (
          <Box key={index}>
            {/* Flowcase labels the one key qualification "Sammendrag" on some CVs; under this heading that read twice. */}
            {qualification.label && !isTheHeading(qualification.label) && (
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75 }}>
                {qualification.label}
              </Typography>
            )}
            {qualification.description && (
              clampLines
                ? <ClampedText text={qualification.description} lines={clampLines} />
                : <Typography variant="body2" color="text.secondary">{qualification.description}</Typography>
            )}
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

function isTheHeading(label: string): boolean {
  return label.trim().toLowerCase() === TITLE.toLowerCase();
}

/**
 * The text cut to `lines` lines by the browser, with the toggle shown only when something was
 * actually cut. Measured, not guessed from a character count: what fits in four lines on a
 * desktop is seven on a phone.
 */
const ClampedText: React.FC<{ text: string; lines: number }> = ({ text, lines }) => {
  const [expanded, setExpanded] = useState(false);
  const [overflowing, setOverflowing] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useLayoutEffect(() => {
    const measure = () => {
      const el = ref.current;
      if (!el || expanded) return;
      setOverflowing(el.scrollHeight > el.clientHeight + 1);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [text, lines, expanded]);

  return (
    <>
      <Typography
        ref={ref}
        variant="body2"
        color="text.secondary"
        sx={expanded ? undefined : {
          display: '-webkit-box',
          WebkitLineClamp: lines,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {text}
      </Typography>
      {(overflowing || expanded) && (
        <Button
          size="small"
          variant="text"
          onClick={() => setExpanded(v => !v)}
          aria-expanded={expanded}
          sx={{ textTransform: 'none', px: 0.5, ml: -0.5, mt: 0.5 }}
        >
          {expanded ? 'Vis mindre' : 'Vis mer'}
        </Button>
      )}
    </>
  );
};

export default CvSummary;
