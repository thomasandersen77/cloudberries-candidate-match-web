import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import type { KeyQualificationDto } from '../../types/api';

interface CvSummaryProps {
  keyQualifications: KeyQualificationDto[];
}

const CvSummary: React.FC<CvSummaryProps> = ({ keyQualifications }) => {
  if (!keyQualifications || keyQualifications.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.01em', mb: 2 }}>
          Sammendrag
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
        Sammendrag
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {keyQualifications.map((qualification, index) => (
          <Box key={index}>
            {qualification.label && (
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.75 }}>
                {qualification.label}
              </Typography>
            )}
            {qualification.description && (
              <Typography variant="body2" color="text.secondary">
                {qualification.description}
              </Typography>
            )}
          </Box>
        ))}
      </Box>
    </Paper>
  );
};

export default CvSummary;