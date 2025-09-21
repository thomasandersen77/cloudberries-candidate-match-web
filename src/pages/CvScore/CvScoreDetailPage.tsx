import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Paper, Chip, Stack } from '@mui/material';
import { getCvScore } from '../../services/cvScoreService';
import type { CvScoreDto } from '../../types/api';

const CvScoreDetailPage: React.FC = () => {
  const { candidateId } = useParams();
  const [score, setScore] = useState<CvScoreDto | null>(null);

  useEffect(() => {
    if (candidateId) getCvScore(candidateId).then(setScore);
  }, [candidateId]);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>CV-score</Typography>
      {score && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6">Score: {score.scorePercent}%</Typography>
          <Typography variant="subtitle1" sx={{ mt: 1 }}>Oppsummering</Typography>
          <Typography paragraph whiteSpace="pre-line">{score.summary}</Typography>

          <Typography variant="subtitle1">Styrker</Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', mb: 2 }}>
            {score.strengths.map((s, i) => <Chip key={i} label={s} />)}
          </Stack>

          <Typography variant="subtitle1">Forbedringsområder</Typography>
          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {score.potentialImprovements.map((s, i) => <Chip key={i} label={s} color="warning" />)}
          </Stack>
        </Paper>
      )}
    </Container>
  );
};

export default CvScoreDetailPage;