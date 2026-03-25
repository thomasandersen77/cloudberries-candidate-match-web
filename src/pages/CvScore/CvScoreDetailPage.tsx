import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Paper,
  Stack,
  Button,
  CircularProgress,
  Snackbar,
  Alert,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { alpha } from '@mui/material/styles';
import { getCvScore, runScoreForCandidate } from '../../services/cvScoreService';
import type { CvScoreDto } from '../../types/api';

const CvScoreDetailPage: React.FC = () => {
  const { candidateId } = useParams();
  const [score, setScore] = useState<CvScoreDto | null>(null);
  const [running, setRunning] = useState(false);
  const [lastEvaluatedAt, setLastEvaluatedAt] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    if (candidateId) getCvScore(candidateId).then((dto) => {
      setScore(dto);
      // Forsøk å lese tidspunkt hvis backend leverer det (evaluatedAt/scoredAt/updatedAt)
      type MaybeIso = Partial<Record<'evaluatedAt' | 'scoredAt' | 'updatedAt', string>>;
      const withIso = dto as unknown as MaybeIso;
      const iso = withIso.evaluatedAt ?? withIso.scoredAt ?? withIso.updatedAt ?? null;
      if (typeof iso === 'string') {
        try {
          const d = new Date(iso);
          if (!isNaN(d.getTime())) setLastEvaluatedAt(d.toLocaleString());
        } catch {/* intentionally empty */}
      }
    });
  }, [candidateId]);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>CV-score</Typography>
      {score && (
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
          <Typography variant="h6">Score: {score.scorePercent}%</Typography>
          {lastEvaluatedAt && (
            <Typography variant="body2" color="text.secondary">Sist scoret: {lastEvaluatedAt}</Typography>
          )}
            {candidateId && (
              <Button
                size="small"
                variant="contained"
                disabled={running}
                startIcon={running ? <CircularProgress size={16} /> : undefined}
                onClick={async () => {
                  try {
                    setRunning(true);
                    const updated = await runScoreForCandidate(candidateId);
                    setScore(updated);
                    type MaybeIso = Partial<Record<'evaluatedAt' | 'scoredAt' | 'updatedAt', string>>;
                    const withIso = updated as unknown as MaybeIso;
                    const iso = withIso.evaluatedAt ?? withIso.scoredAt ?? withIso.updatedAt ?? null;
                    if (typeof iso === 'string') {
                      try {
                        const d = new Date(iso);
                        if (!isNaN(d.getTime())) setLastEvaluatedAt(d.toLocaleString());
                      } catch {/* intentionally empty */}
                    }
                    setSnack({ open: true, message: 'Scoring fullført', severity: 'success' });
        } catch {
                    setSnack({ open: true, message: 'Scoring feilet', severity: 'error' });
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

          <Typography variant="subtitle1" sx={{ mt: 2 }}>
            Styrker
          </Typography>
          <List dense disablePadding sx={{ mb: 2 }}>
            {score.strengths.map((s, i) => (
              <ListItem
                key={i}
                alignItems="flex-start"
                sx={(theme) => ({
                  py: 1.25,
                  px: 2,
                  mb: 1,
                  borderRadius: 1,
                  bgcolor: theme.palette.mode === 'dark' ? 'grey.800' : 'grey.100',
                })}
              >
                <ListItemText
                  primary={s}
                  primaryTypographyProps={{
                    variant: 'body1',
                    sx: {
                      whiteSpace: 'normal',
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-word',
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>

          <Typography variant="subtitle1">Forbedringsområder</Typography>
          <List dense disablePadding>
            {score.potentialImprovements.map((s, i) => (
              <ListItem
                key={i}
                alignItems="flex-start"
                sx={(theme) => ({
                  py: 1.25,
                  px: 2,
                  mb: 1,
                  borderRadius: 1,
                  bgcolor: alpha(theme.palette.warning.main, theme.palette.mode === 'dark' ? 0.22 : 0.14),
                  borderLeft: '4px solid',
                  borderColor: 'warning.main',
                })}
              >
                <ListItemText
                  primary={s}
                  primaryTypographyProps={{
                    variant: 'body1',
                    sx: {
                      whiteSpace: 'normal',
                      overflowWrap: 'anywhere',
                      wordBreak: 'break-word',
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
      <Snackbar open={snack.open} autoHideDuration={4000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default CvScoreDetailPage;