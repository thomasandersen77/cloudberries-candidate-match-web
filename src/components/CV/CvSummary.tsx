import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import type { KeyQualificationDto } from '../../types/api';

interface CvSummaryProps {
  keyQualifications: KeyQualificationDto[];
}

const CvSummary: React.FC<CvSummaryProps> = ({ keyQualifications }) => {
  if (!keyQualifications || keyQualifications.length === 0) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Sammendrag
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ingen nøkkelkvalifikasjoner tilgjengelig
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Sammendrag
      </Typography>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {keyQualifications.map((qualification, index) => (
          <Box key={index}>
            {qualification.label && (
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
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