import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button, Stack, LinearProgress, Backdrop, CircularProgress, Snackbar, Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getAllCandidates, getCvScore, runScoreForAll } from '../../services/cvScoreService';
import type { CvScoreDto } from '../../types/api';

const CvScoreListPage: React.FC = () => {
  const [rows, setRows] = useState<Array<{ id: string; name: string; scorePercent: number; summary: string }>>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);
  const [snack, setSnack] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({ open: false, message: '', severity: 'success' });
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const cs = await getAllCandidates();
        // Fetch scores for all candidates in parallel
        const scored = await Promise.all(
          cs.map(async (c) => {
            try {
              const dto: CvScoreDto = await getCvScore(c.id);
              return { id: c.id, name: c.name, scorePercent: dto.scorePercent ?? 0, summary: dto.summary ?? '' };
    } catch {
              return { id: c.id, name: c.name, scorePercent: 0, summary: '' };
            }
          })
        );
        // Sort by score descending
        scored.sort((a, b) => (b.scorePercent ?? 0) - (a.scorePercent ?? 0));
        setRows(scored);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Container sx={{ py: 4 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ m: 0 }}>CV-Score (alle)</Typography>
        <Button
          size="small"
          variant="contained"
          disabled={running}
          startIcon={running ? <CircularProgress size={16} /> : undefined}
          onClick={async () => {
            try {
              setRunning(true);
              const { processedCount } = await runScoreForAll();
              // Refresh scores and rows after batch run
              const fresh = await getAllCandidates();
              const refreshed = await Promise.all(
                fresh.map(async (c) => {
                  try {
                    const dto: CvScoreDto = await getCvScore(c.id);
                    return { id: c.id, name: c.name, scorePercent: dto.scorePercent ?? 0, summary: dto.summary ?? '' };
                  } catch {
                    return { id: c.id, name: c.name, scorePercent: 0, summary: '' };
                  }
                })
              );
              refreshed.sort((a, b) => (b.scorePercent ?? 0) - (a.scorePercent ?? 0));
              setRows(refreshed);
              setSnack({ open: true, message: `Scoring fullført – prosesserte ${processedCount}`, severity: 'success' });
      } catch {
              setSnack({ open: true, message: 'Scoring feilet', severity: 'error' });
            } finally {
              setRunning(false);
            }
          }}
        >
          {running ? 'Skårer alle…' : 'Kjør scoring for alle'}
        </Button>
      </Stack>
      {running && <LinearProgress sx={{ mb: 1 }} />}
      <Paper sx={{ p: 2, position: 'relative' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell width={200}>Navn</TableCell>
              <TableCell width={120}>Score</TableCell>
              <TableCell>Oppsummering (2 setninger)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/cv-score/${encodeURIComponent(r.id)}`)}>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.scorePercent}%</TableCell>
                <TableCell>{twoSentenceSummary(r.summary)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {(loading || running) && <LinearProgress sx={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} />}
      </Paper>
      <Backdrop open={running} sx={{ color: '#fff', zIndex: (theme) => theme.zIndex.drawer + 1 }}>
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
  // Split on sentence boundaries (., !, ?) followed by space/cap or end.
  const sentences = text
    .replace(/\s+/g, ' ')
    .match(/[^.!?]+[.!?]/g);
  if (!sentences || sentences.length === 0) return text;
  const firstTwo = sentences.slice(0, 2).join(' ').trim();
  return firstTwo;
}

export default CvScoreListPage;
