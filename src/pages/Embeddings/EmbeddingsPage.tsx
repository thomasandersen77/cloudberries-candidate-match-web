import React, { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { getEmbeddingInfo } from '../../services/consultantsService';
import { runJason, runForUserCv, runMissing } from '../../services/embeddingsService';
import type {
  EmbeddingJasonRunResponse,
  EmbeddingProviderInfo,
  EmbeddingRunMissingResponse,
  EmbeddingUserCvRunResponse,
} from '../../types/api';

type EmbeddingResult = EmbeddingJasonRunResponse | EmbeddingUserCvRunResponse | EmbeddingRunMissingResponse;

const EmbeddingsPage: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [cvId, setCvId] = useState('');
  const [batchSize, setBatchSize] = useState<number>(50);
  const [result, setResult] = useState<EmbeddingResult | null>(null);
  const [status, setStatus] = useState<EmbeddingProviderInfo | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [forceConfirmOpen, setForceConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setStatus(await getEmbeddingInfo());
      } catch {
        setStatusError('Kunne ikke hente embedding-status.');
      }
    })();
  }, []);

  const semanticReady = status?.semanticSearchReady ?? status?.enabled ?? false;

  const runMissingBatch = async () => {
    setRunning(true);
    try {
      setResult(await runMissing(batchSize));
      setStatus(await getEmbeddingInfo());
    } finally {
      setRunning(false);
      setForceConfirmOpen(false);
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Embeddings</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Embedding-status</Typography>
        {statusError && <Alert severity="warning" sx={{ mb: 1 }}>{statusError}</Alert>}
        {status ? (
          <Stack spacing={0.5}>
            <Typography variant="body2"><strong>Aktiv:</strong> {status.enabled ? 'Ja' : 'Nei'}</Typography>
            <Typography variant="body2"><strong>Leverandør:</strong> {status.provider ?? '–'}</Typography>
            <Typography variant="body2"><strong>Modell:</strong> {status.model ?? '–'}</Typography>
            <Typography variant="body2"><strong>Dimensjon:</strong> {status.dimension ?? '–'}</Typography>
            {typeof status.activeEmbeddingCount === 'number' && (
              <Typography variant="body2"><strong>Aktive embeddings:</strong> {status.activeEmbeddingCount}</Typography>
            )}
            {typeof status.totalConsultantCount === 'number' && (
              <Typography variant="body2"><strong>Konsulenter totalt:</strong> {status.totalConsultantCount}</Typography>
            )}
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip
                size="small"
                label={semanticReady ? 'Semantisk søk er klart' : 'Semantisk søk mangler embeddings'}
                color={semanticReady ? 'success' : 'warning'}
                variant="outlined"
              />
            </Stack>
          </Stack>
        ) : !statusError && (
          <Typography variant="body2" color="text.secondary">Laster status…</Typography>
        )}
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Kjør Jason-demo</Typography>
        <Button variant="contained" sx={{ mt: 1 }} disabled={running} onClick={async () => setResult(await runJason())}>Kjør</Button>
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Kjør for User/CV</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
          <TextField label="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} size="small" />
          <TextField label="CV ID" value={cvId} onChange={(e) => setCvId(e.target.value)} size="small" />
          <Button variant="contained" disabled={running} onClick={async () => userId && cvId && setResult(await runForUserCv(userId, cvId))}>
            Kjør
          </Button>
        </Stack>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6">Generer embeddings for manglende</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
          <TextField label="Batch size" type="number" value={batchSize} onChange={(e) => setBatchSize(Number(e.target.value))} size="small" />
          <Button variant="contained" disabled={running} onClick={() => void runMissingBatch()}>Rebuild embeddings</Button>
          <Button variant="outlined" color="warning" disabled={running} onClick={() => setForceConfirmOpen(true)}>
            Force rebuild
          </Button>
        </Stack>
      </Paper>

      {result && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">Resultat</Typography>
          <Paper sx={{ p: 2 }}>
            <pre style={{ margin: 0 }}>{JSON.stringify(result, null, 2)}</pre>
          </Paper>
        </Box>
      )}

      <Dialog open={forceConfirmOpen} onClose={() => setForceConfirmOpen(false)}>
        <DialogTitle>Bekreft force rebuild</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Dette kan ta lang tid og belaste embedding-tjenesten. Vil du fortsette?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForceConfirmOpen(false)}>Avbryt</Button>
          <Button color="warning" variant="contained" onClick={() => void runMissingBatch()} disabled={running}>
            Fortsett
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EmbeddingsPage;
