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
import { runForUserCv, runMissing } from '../../services/embeddingsService';
import type {
  EmbeddingProviderInfo,
  EmbeddingRunMissingResponse,
  EmbeddingUserCvRunResponse,
} from '../../types/api';

type EmbeddingResult = EmbeddingUserCvRunResponse | EmbeddingRunMissingResponse;

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

      {/*
        What the page is for, said on the page. Everything here operates on a table nobody sees, so
        without this the buttons are three ways to do something unnamed to something invisible.
      */}
      <Paper variant="outlined" sx={{ p: 2, mb: 2, bgcolor: 'action.hover' }}>
        <Stack spacing={1.25}>
          <Typography variant="body2">
            En embedding er en CV oversatt til tall, slik at to tekster kan sammenlignes på mening
            og ikke på ord. Det er dette som gjør at «Hvem har jobbet med modernisering av gamle
            Java-systemer?» finner en konsulent som har skrevet «migrerte monolitt til
            mikrotjenester», uten at et eneste ord er felles. Uten embeddings virker fortsatt søk på
            navngitte ferdigheter, som «Hvem kan Java og Kotlin?», fordi det leser den normaliserte
            ferdighetstabellen. Det er den semantiske halvdelen som faller bort.
          </Typography>
          <Typography variant="body2">
            De lages av Googles <strong>gemini-embedding-001</strong>, som ligger på Geminis
            gratisnivå. Det betyr ingen regning, men en kvote: <strong>1000 kall per døgn per
            modell</strong>, og en egen grense per minutt. Derfor går en ombygging i puljer med
            halvannet sekunds pause mellom hvert kall, og derfor er det verdt å kjøre «Rebuild
            embeddings», som bare tar de som mangler, framfor «Force rebuild», som tar alle om
            igjen. Treffer kjøringen døgnkvoten, stopper den til kvoten ruller over neste dag.
          </Typography>
          <Typography variant="body2" color="text.secondary">
            En CV som er endret i Flowcase har fortsatt sin gamle embedding til den bygges om. Det
            er den vanligste grunnen til å kjøre noe herfra.
          </Typography>
        </Stack>
      </Paper>

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

      {/*
        The Jason demo embedded one hard-coded CV and answered {"processedJason": false}, which says
        nothing to anybody who was not there when it was written. The endpoint is still there and
        runJason still calls it; it is the button that is gone.
      */}

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
        <Typography variant="h6">Generer embeddings for konsulenter som mangler</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Tar bare de uten embedding for gjeldende modell. «Force rebuild» tar alle om igjen, som
          er én kvotebruk per konsulent.
        </Typography>
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
