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
  Box,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { getCvScore, runScoreForCandidate } from '../../services/cvScoreService';
import type { CvScoreDto } from '../../types/api';
import CvScoreBadge from '../../components/CvScoreBadge';

const CvScoreDetailPage: React.FC = () => {
  const theme = useTheme();
  const { candidateId } = useParams();
  const [score, setScore] = useState<CvScoreDto | null>(null);
  const [running, setRunning] = useState(false);
  const [lastEvaluatedAt, setLastEvaluatedAt] = useState<string | null>(null);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const greenTint =
    theme.palette.mode === 'light' ? alpha(theme.palette.success.main, 0.08) : alpha(theme.palette.success.main, 0.14);
  const orangeTint =
    theme.palette.mode === 'light' ? alpha(theme.palette.primary.main, 0.09) : alpha(theme.palette.primary.main, 0.16);

  useEffect(() => {
    if (candidateId)
      getCvScore(candidateId).then((dto) => {
        setScore(dto);
        type MaybeIso = Partial<Record<'evaluatedAt' | 'scoredAt' | 'updatedAt', string>>;
        const withIso = dto as unknown as MaybeIso;
        const iso = withIso.evaluatedAt ?? withIso.scoredAt ?? withIso.updatedAt ?? null;
        if (typeof iso === 'string') {
          try {
            const d = new Date(iso);
            if (!isNaN(d.getTime())) setLastEvaluatedAt(d.toLocaleString());
          } catch {
            /* empty */
          }
        }
      });
  }, [candidateId]);

  return (
    <Container sx={{ py: { xs: 2, md: 4 } }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 3 }}>
        CV-score
      </Typography>
      {score && (
        <Stack spacing={3}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 2.5, md: 3 },
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: { md: 'center' },
              justifyContent: 'space-between',
              gap: 2,
              background: theme.palette.mode === 'light' ? alpha('#111111', 0.02) : alpha('#fff', 0.04),
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                  Totalscore
                </Typography>
                <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                  <CvScoreBadge score={score.scorePercent} sizePx={56} thickness={3} />
                  <Typography variant="h5" sx={{ fontWeight: 700 }}>
                    {score.scorePercent}%
                  </Typography>
                </Stack>
              </Box>
              {lastEvaluatedAt && (
                <Typography variant="body2" color="text.secondary">
                  Sist scoret: {lastEvaluatedAt}
                </Typography>
              )}
            </Stack>
            {candidateId && (
              <Button
                size="medium"
                variant="contained"
                disabled={running}
                startIcon={running ? <CircularProgress size={16} color="inherit" /> : undefined}
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
                      } catch {
                        /* empty */
                      }
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
          </Paper>

          <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 } }}>
            <Typography variant="h6" sx={{ fontWeight: 600, mb: 1.5 }}>
              Oppsummering
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ lineHeight: 1.65, whiteSpace: 'pre-line' }}>
              {score.summary}
            </Typography>

            <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 1.5 }}>
              Styrker
            </Typography>
            <Stack spacing={1.25}>
              {score.strengths.map((s, i) => (
                <Box
                  key={i}
                  sx={{
                    py: 1.5,
                    px: 2,
                    borderRadius: 2,
                    bgcolor: greenTint,
                    border: `1px solid ${alpha(theme.palette.success.main, 0.22)}`,
                  }}
                >
                  <Typography variant="body1" sx={{ lineHeight: 1.6, overflowWrap: 'anywhere' }}>
                    {s}
                  </Typography>
                </Box>
              ))}
            </Stack>

            <Typography variant="h6" sx={{ fontWeight: 600, mt: 3, mb: 1.5 }}>
              Forbedringsområder
            </Typography>
            <Stack spacing={1.25}>
              {score.potentialImprovements.map((s, i) => (
                <Box
                  key={i}
                  sx={{
                    py: 1.5,
                    px: 2,
                    borderRadius: 2,
                    bgcolor: orangeTint,
                    border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
                  }}
                >
                  <Typography variant="body1" sx={{ lineHeight: 1.6, overflowWrap: 'anywhere' }}>
                    {s}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Paper>
        </Stack>
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
