import React, { useEffect, useMemo, useState } from 'react';
import {
  Container,
  Typography,
  Paper,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableContainer,
  Button,
  Stack,
  LinearProgress,
  Backdrop,
  CircularProgress,
  Snackbar,
  Alert,
  Box,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import {
  getAllCandidates,
  loadCvScoreListRows,
  runScoreForCandidate,
  type CvScoreListRow,
} from '../../services/cvScoreService';
import { sortCvScoreRows } from '../../utils/cvScoreSort';
import CvScoreBadge from '../../components/CvScoreBadge';

const CvScoreListPage: React.FC = () => {
  const theme = useTheme();
  const [rows, setRows] = useState<CvScoreListRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const candidates = await getAllCandidates();
        await loadCvScoreListRows(candidates, (partial) => {
          if (!cancelled) setRows(partial);
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const sortedRows = useMemo(() => sortCvScoreRows(rows), [rows]);

  const stats = useMemo(() => {
    const scored = rows.filter((r) => r.scorePercent > 0);
    const n = scored.length;
    if (n === 0) return { total: rows.length, scored: 0, avg: 0 };
    const sum = scored.reduce((acc, r) => acc + r.scorePercent, 0);
    return { total: rows.length, scored: n, avg: Math.round(sum / n) };
  }, [rows]);

  return (
    <Container sx={{ py: { xs: 2, md: 4 } }}>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ alignItems: { sm: 'flex-end' }, justifyContent: 'space-between', mb: 3 }}>
        <Box>
          <Typography variant="h4" component="h1" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 0.5 }}>
            CV-Score
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Oversikt over AI-vurdering av alle kandidat-CV-er
          </Typography>
        </Box>
        <Button
          size="medium"
          variant="contained"
          disabled={running}
          startIcon={running ? <CircularProgress size={16} color="inherit" /> : undefined}
          onClick={async () => {
            try {
              setRunning(true);
              const missing = rows.filter((r) => (r.scorePercent ?? 0) === 0).map((r) => ({ id: r.id, name: r.name }));
              let processed = 0;
              for (const m of missing) {
                try {
                  await runScoreForCandidate(m.id);
                  processed += 1;
                } catch {
                  /* continue */
                }
              }
              const fresh = await getAllCandidates();
              const refreshed = await loadCvScoreListRows(fresh);
              setRows(refreshed);
              setSnack({
                open: true,
                message: `Scoring fullført – prosesserte ${processed} (kun de uten score)`,
                severity: 'success',
              });
            } catch {
              setSnack({ open: true, message: 'Scoring feilet', severity: 'error' });
            } finally {
              setRunning(false);
            }
          }}
        >
          {running ? 'Skårer manglende…' : 'Kjør scoring for alle'}
        </Button>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          display: 'flex',
          flexWrap: 'wrap',
          gap: 3,
          bgcolor: theme.palette.mode === 'light' ? alpha('#111111', 0.02) : alpha('#fff', 0.04),
        }}
      >
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Analysert
          </Typography>
          <Typography variant="h6" sx={{ fontWeight: 700, mt: 0.25 }}>
            {stats.total}
          </Typography>
        </Box>
        <Box>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            Gjennomsnittsscore
          </Typography>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 0.25 }}>
            <CvScoreBadge score={stats.avg} size="md" />
            <Typography variant="body2" color="text.secondary">
              {stats.scored ? `${stats.avg}% (${stats.scored} scoret)` : '—'}
            </Typography>
          </Stack>
        </Box>
      </Paper>

      {running && <LinearProgress sx={{ mb: 2, borderRadius: 1 }} />}
      <Paper elevation={0} sx={{ overflow: 'hidden', position: 'relative' }}>
        <TableContainer sx={{ maxHeight: { md: 'min(70vh, 720px)' } }}>
          <Table size="medium" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell width={280}>Navn</TableCell>
                <TableCell width={120} align="center">
                  Score
                </TableCell>
                <TableCell>Oppsummering</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {sortedRows.map((r) => (
                <TableRow
                  key={r.id}
                  hover
                  sx={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/cv-score/${encodeURIComponent(r.id)}`)}
                >
                  <TableCell>
                    <Typography variant="subtitle2" sx={{ fontWeight: 600, letterSpacing: '-0.01em' }}>
                      {r.name}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <CvScoreBadge score={r.scorePercent} size="md" />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }}>
                      {twoSentenceSummary(r.summary)}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        {(loading || running) && <LinearProgress sx={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} />}
      </Paper>
      <Backdrop open={running} sx={{ color: '#fff', zIndex: (t) => t.zIndex.drawer + 1 }}>
        <Stack spacing={2} alignItems="center">
          <CircularProgress color="inherit" />
          <Typography>Skårer alle konsulenter… dette kan ta noen minutter</Typography>
        </Stack>
      </Backdrop>
      <Snackbar open={snack.open} autoHideDuration={5000} onClose={() => setSnack((s) => ({ ...s, open: false }))}>
        <Alert onClose={() => setSnack((s) => ({ ...s, open: false }))} severity={snack.severity} variant="filled" sx={{ width: '100%' }}>
          {snack.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

function twoSentenceSummary(text: string): string {
  if (!text) return '';
  const sentences = text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]/g);
  if (!sentences || sentences.length === 0) return text;
  return sentences.slice(0, 2).join(' ').trim();
}

export default CvScoreListPage;
