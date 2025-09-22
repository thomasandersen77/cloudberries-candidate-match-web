import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Typography, Paper, Chip, Stack, Button } from '@mui/material';
import { getCvScore, runScoreForCandidate } from '../../services/cvScoreService';
import type { CvScoreDto } from '../../types/api';

const CvScoreDetailPage: React.FC = () => {
  const { candidateId } = useParams();
  const [score, setScore] = useState<CvScoreDto | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    if (candidateId) getCvScore(candidateId).then(setScore);
  }, [candidateId]);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>CV-score</Typography>
      {score && (
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
            <Typography variant="h6">Score: {score.scorePercent}%</Typography>
            {candidateId && (
              <Button
                size="small"
                variant="contained"
                disabled={running}
                onClick={async () => {
                  try {
                    setRunning(true);
                    const updated = await runScoreForCandidate(candidateId);
                    setScore(updated);
                  } finally {
                    setRunning(false);
                  }
                }}
              >
                {running ? 'Kjører…' : 'Score på nytt'}
              </Button>
            )}
          </Stack>
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