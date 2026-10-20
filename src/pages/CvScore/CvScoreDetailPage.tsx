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
import { reviewRulesLabel, formatScoredAt, scoringErrorMessage } from './cvScoreDetailText';
import { alpha, useTheme } from '@mui/material/styles';
import { getCvScore, recalculateScoreForCandidate } from '../../services/cvScoreService';
import type { CvScoreDto } from '../../types/api';
import CvScoreBadge from '../../components/CvScoreBadge';
import HighQualityToggle from '../../components/HighQualityToggle';

const CvScoreDetailPage: React.FC = () => {
  const theme = useTheme();
  const { candidateId } = useParams();
  const [score, setScore] = useState<CvScoreDto | null>(null);
  const [running, setRunning] = useState(false);
  // Default off every time; not persisted.
  const [highQuality, setHighQuality] = useState(false);
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

  const [loadError, setLoadError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  // Bumped by «Hent på nytt», so a retry is a plain re-run of the effect, with no scoring.
  const [loadAttempt, setLoadAttempt] = useState(0);

  // The answer belongs to the candidate the page is on. The effect took whatever answer came
  // last, so opened from A to B, a slow A overwrote B; and it had no catch, so a failed load left
  // the heading and nothing else.
  useEffect(() => {
    if (!candidateId) return;
    let current = true;
    setScore(null);
    setLastEvaluatedAt(null);
    setLoadError(null);
    setLoading(true);
    getCvScore(candidateId)
      .then((dto) => {
        if (!current) return;
        setScore(dto);
        setLastEvaluatedAt(formatScoredAt(dto));
      })
      .catch(() => {
        if (current) setLoadError('Kunne ikke hente CV-scoren.');
      })
      .finally(() => {
        if (current) setLoading(false);
      });
    return () => {
      current = false;
    };
  }, [candidateId, loadAttempt]);

  return (
    <Container sx={{ py: { xs: 2, md: 4 } }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 3 }}>
        CV-score
      </Typography>
      {loading && <CircularProgress size={24} />}
      {loadError && (
        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={() => setLoadAttempt((n) => n + 1)}>
              Hent på nytt
            </Button>
          }
        >
          {loadError}
        </Alert>
      )}
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
              <Typography variant="body2" color="text.secondary">
                {lastEvaluatedAt ? `Sist scoret: ${lastEvaluatedAt}` : 'Tidspunkt for scoring er ikke registrert'}
              </Typography>
            </Stack>
            {candidateId && (
              <Stack spacing={1} alignItems={{ xs: 'flex-start', md: 'flex-end' }}>
              <HighQualityToggle checked={highQuality} onChange={setHighQuality} disabled={running} />
              <Button
                size="medium"
                variant="contained"
                disabled={running}
                startIcon={running ? <CircularProgress size={16} color="inherit" /> : undefined}
                onClick={async () => {
                  try {
                    setRunning(true);
                    const updated = await recalculateScoreForCandidate(candidateId, { useHighestQualityModel: highQuality });
                    // A rescore takes most of a minute; the page may be on someone else by then.
                    if (updated.candidateId !== candidateId) return;
                    setScore(updated);
                    setLastEvaluatedAt(formatScoredAt(updated));
                    setSnack({ open: true, message: 'Scoring fullført', severity: 'success' });
                  } catch (e) {
                    setSnack({ open: true, message: scoringErrorMessage(e), severity: 'error' });
                  } finally {
                    setRunning(false);
                  }
                }}
              >
                {running ? 'Kjører…' : 'Score på nytt'}
              </Button>
              </Stack>
            )}
          </Paper>
          {score.promptVersion && <Typography variant="body2" color="text.secondary">
            Vurdert med {score.promptVersion} · Gjeldende prompt: {score.currentPromptVersion ?? 'ukjent'}
          </Typography>}
          {reviewRulesLabel(score.rulesStatus) && <Alert severity={score.rulesStatus === 'OUTDATED' ? 'warning' : 'info'}>
            {reviewRulesLabel(score.rulesStatus)}.
            {score.rulesStatus === 'OUTDATED' && ' Velg «Score på nytt» for en vurdering etter dagens regler.'}
          </Alert>}
          {score.stale && score.scorePercent > 0 && (
            <Alert severity="warning">
              Skåren er ikke laget fra CV-en slik den er nå: CV-en er endret siden, eller skåren er fra
              før vi registrerte hvilken versjon den leste. Score på nytt for en oppdatert vurdering.
            </Alert>
          )}

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
