import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { getEmbeddingInfo } from '../../services/consultantsService';
import {
  getEmbeddingFreshness,
  rebuildChunkEmbeddings,
  rebuildWholeCvEmbeddings,
  runForUserCv,
  type RebuildOptions,
} from '../../services/embeddingsService';
import type {
  ChunkRebuildResult,
  EmbeddingFreshness,
  EmbeddingProviderInfo,
  EmbeddingRebuildResult,
  EmbeddingUserCvRunResponse,
  RebuildOrder,
} from '../../types/api';
import PageIntro from '../../components/PageIntro';
import { apiErrorMessage, isConflict } from '../../utils/apiError';
import { STATE_COLOR, STATE_LABEL, formatEmbeddedAt, isTimeout } from './embeddingFreshnessText';

type RebuildOutcome = { wholeCv?: EmbeddingRebuildResult; chunks?: ChunkRebuildResult };

const ORDER_LABEL: Record<RebuildOrder, string> = {
  DATABASE: 'Databaserekkefølge',
  REVERSE: 'Omvendt',
  OLDEST_FIRST: 'Eldste vektor først',
};

const EmbeddingsPage: React.FC = () => {
  const [userId, setUserId] = useState('');
  const [cvId, setCvId] = useState('');
  const [singleResult, setSingleResult] = useState<EmbeddingUserCvRunResponse | null>(null);
  const [status, setStatus] = useState<EmbeddingProviderInfo | null>(null);
  const [statusError, setStatusError] = useState<string | null>(null);
  const [freshness, setFreshness] = useState<EmbeddingFreshness | null>(null);
  const [order, setOrder] = useState<RebuildOrder>('DATABASE');
  const [limit, setLimit] = useState('');
  const [outcome, setOutcome] = useState<RebuildOutcome | null>(null);
  const [notice, setNotice] = useState<{ severity: 'info' | 'error'; text: string } | null>(null);
  const [forceConfirmOpen, setForceConfirmOpen] = useState(false);
  const [running, setRunning] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const refresh = useCallback(async () => {
    try {
      setStatus(await getEmbeddingInfo());
    } catch {
      setStatusError('Kunne ikke hente embedding-status.');
    }
    try {
      setFreshness(await getEmbeddingFreshness());
    } catch {
      setStatusError('Kunne ikke hente hvor oppdaterte embeddingene er.');
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const semanticReady = status?.semanticSearchReady ?? status?.enabled ?? false;

  /**
   * Both buttons called the batch for consultants without a vector, which has no force at all, so
   * «Force rebuild» did nothing once everyone had a vector. Both now run the two rebuilds, whole-CV
   * then chunks, with force set as the button says.
   */
  const runRebuild = async (force: boolean) => {
    setForceConfirmOpen(false);
    setRunning(true);
    setNotice(null);
    setOutcome(null);
    const opts: RebuildOptions = { force, order, limit: Number(limit) > 0 ? Number(limit) : undefined };
    try {
      const wholeCv = await rebuildWholeCvEmbeddings(opts);
      setOutcome({ wholeCv });
      const chunks = await rebuildChunkEmbeddings(opts);
      setOutcome({ wholeCv, chunks });
      if ((chunks.rateLimited ?? 0) > 0) {
        setNotice({
          severity: 'info',
          text: 'Stoppet på kvoten hos Google. De som ikke ble nådd, beholder vektorene de har. Kjør igjen senere for å fortsette.',
        });
      }
    } catch (e) {
      setNotice(
        isTimeout(e)
          ? { severity: 'info', text: 'Svaret tok for lang tid, men byggingen fortsetter på serveren. Oppdater status for å følge med.' }
          // Another rebuild, or a sync's refresh, is running: one at a time against the daily quota.
          : isConflict(e)
            ? { severity: 'info', text: apiErrorMessage(e) ?? 'En oppdatering av embeddings pågår allerede.' }
            : { severity: 'error', text: 'Byggingen feilet.' }
      );
    } finally {
      setRunning(false);
      await refresh();
    }
  };

  const rows = useMemo(
    () =>
      (freshness?.consultants ?? []).filter(
        (r) => showAll || r.wholeCv.state === 'MISSING' || r.wholeCv.state === 'STALE' || r.chunks.state === 'MISSING' || r.chunks.state === 'STALE'
      ),
    [freshness, showAll]
  );

  /** One call per whole-CV vector and one per stored chunk; a forced run makes all of them. */
  const forcedCalls = useMemo(
    () => (freshness ? freshness.eligible + freshness.consultants.reduce((sum, r) => sum + (r.chunks.chunks ?? 0), 0) : null),
    [freshness]
  );

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Embeddings</Typography>
      <PageIntro page="embeddings" />

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6" gutterBottom>Embedding-status</Typography>
        {statusError && <Alert severity="warning" sx={{ mb: 1 }}>{statusError}</Alert>}
        {status ? (
          <Stack spacing={0.5}>
            <Typography variant="body2"><strong>Aktiv:</strong> {status.enabled ? 'Ja' : 'Nei'}</Typography>
            <Typography variant="body2"><strong>Leverandør:</strong> {status.provider ?? '–'}</Typography>
            <Typography variant="body2"><strong>Modell:</strong> {status.model ?? '–'}</Typography>
            <Typography variant="body2"><strong>Dimensjon:</strong> {status.dimension ?? '–'}</Typography>
            {freshness && (
              <>
                <Typography variant="body2">
                  <strong>Hel-CV:</strong> {freshness.wholeCv.current} oppdatert · {freshness.wholeCv.stale} utdatert ·{' '}
                  {freshness.wholeCv.missing} mangler, av {freshness.eligible} konsulenter med CV-innhold
                </Typography>
                <Typography variant="body2">
                  <strong>Chunks:</strong> {freshness.chunks.current} oppdatert · {freshness.chunks.stale} utdatert ·{' '}
                  {freshness.chunks.missing} mangler
                  {freshness.chunks.nothingToEmbed > 0 && ` · ${freshness.chunks.nothingToEmbed} uten tekst å dele opp`}
                </Typography>
              </>
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
        <Typography variant="h6">Kjør for User/CV</Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1 }}>
          <TextField label="User ID" value={userId} onChange={(e) => setUserId(e.target.value)} size="small" />
          <TextField label="CV ID" value={cvId} onChange={(e) => setCvId(e.target.value)} size="small" />
          <Button variant="contained" disabled={running} onClick={async () => userId && cvId && setSingleResult(await runForUserCv(userId, cvId))}>
            Kjør
          </Button>
        </Stack>
        {singleResult && <pre style={{ margin: '12px 0 0' }}>{JSON.stringify(singleResult, null, 2)}</pre>}
      </Paper>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Typography variant="h6">Bygg embeddings</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Bygger hel-CV-vektor og chunks. Vanlig bygging hopper over dem som er oppdatert, og bruker bare kvote på de
          som mangler eller er utdatert. «Force rebuild» bygger alle på nytt. Begge stopper ved kvoten, og neste
          kjøring fortsetter.
        </Typography>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mt: 1.5 }} alignItems={{ sm: 'center' }}>
          <FormControl size="small" sx={{ minWidth: 200 }}>
            <InputLabel id="rebuild-order">Rekkefølge</InputLabel>
            <Select labelId="rebuild-order" label="Rekkefølge" value={order} onChange={(e) => setOrder(e.target.value as RebuildOrder)}>
              {(Object.keys(ORDER_LABEL) as RebuildOrder[]).map((o) => (
                <MenuItem key={o} value={o}>{ORDER_LABEL[o]}</MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Maks antall konsulenter"
            type="number"
            size="small"
            value={limit}
            onChange={(e) => setLimit(e.target.value)}
            helperText="Tomt betyr alle"
          />
          <Button variant="contained" disabled={running} onClick={() => void runRebuild(false)}>
            Bygg manglende og utdaterte
          </Button>
          <Button variant="outlined" color="warning" disabled={running} onClick={() => setForceConfirmOpen(true)}>
            Force rebuild
          </Button>
        </Stack>
        {running && (
          <Alert severity="info" sx={{ mt: 2 }}>
            Bygger… Med kvotens tempo tar en full bygging lang tid. Siden kan lukkes; byggingen fortsetter på serveren.
          </Alert>
        )}
        {notice && <Alert severity={notice.severity} sx={{ mt: 2 }}>{notice.text}</Alert>}
        {outcome && (
          <Box sx={{ mt: 2 }}>
            {outcome.wholeCv && (
              <Typography variant="body2">
                <strong>Hel-CV:</strong> {outcome.wholeCv.processed} gått gjennom, {outcome.wholeCv.created + outcome.wholeCv.updated} bygget,{' '}
                {outcome.wholeCv.skipped} uendret, {outcome.wholeCv.failed} feilet
              </Typography>
            )}
            {outcome.chunks && (
              <Typography variant="body2">
                <strong>Chunks:</strong> {outcome.chunks.processed} gått gjennom, {(outcome.chunks.created ?? 0) + (outcome.chunks.updated ?? 0)} bygget
                ({outcome.chunks.totalChunks} chunks), {outcome.chunks.skipped} uendret, {outcome.chunks.failed} feilet
                {(outcome.chunks.rateLimited ?? 0) > 0 && ', stoppet på kvoten'}
              </Typography>
            )}
          </Box>
        )}
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" flexWrap="wrap" gap={1}>
          <Typography variant="h6">Per konsulent</Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <FormControlLabel
              control={<Switch checked={showAll} onChange={(e) => setShowAll(e.target.checked)} />}
              label="Vis også oppdaterte"
            />
            <Button size="small" onClick={() => void refresh()} disabled={running}>Oppdater status</Button>
          </Stack>
        </Stack>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
          Utdatert betyr at vektoren er laget fra en annen tekst enn CV-en gir nå, for eksempel før CV-en ble endret.
        </Typography>
        {freshness && rows.length === 0 ? (
          <Typography variant="body2">Alle {freshness.eligible} er oppdatert.</Typography>
        ) : (
          <TableContainer sx={{ maxHeight: 520 }}>
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Konsulent</TableCell>
                  <TableCell>Hel-CV</TableCell>
                  <TableCell>Chunks</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={`${r.userId}-${r.cvId}`}>
                    <TableCell>{r.name}</TableCell>
                    {/* Each with its own date: the two are built separately, and one can be fresh while the other is not. */}
                    <TableCell>
                      <Chip size="small" variant="outlined" label={STATE_LABEL[r.wholeCv.state]} color={STATE_COLOR[r.wholeCv.state]} />{' '}
                      <Typography component="span" variant="caption" color="text.secondary">{formatEmbeddedAt(r.wholeCv.embeddedAt)}</Typography>
                    </TableCell>
                    <TableCell>
                      <Chip size="small" variant="outlined" label={STATE_LABEL[r.chunks.state]} color={STATE_COLOR[r.chunks.state]} />{' '}
                      <Typography component="span" variant="caption" color="text.secondary">
                        {r.chunks.chunks ? `${r.chunks.chunks} chunks · ` : ''}{formatEmbeddedAt(r.chunks.embeddedAt)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={forceConfirmOpen} onClose={() => setForceConfirmOpen(false)}>
        <DialogTitle>Bekreft force rebuild</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Bygger alle vektorene på nytt, også de som er oppdatert
            {forcedCalls !== null && `: omtrent ${forcedCalls} kall mot en kvote på 1000 i døgnet`}. Rekkefølge:{' '}
            {ORDER_LABEL[order].toLowerCase()}. Vil du fortsette?
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setForceConfirmOpen(false)}>Avbryt</Button>
          <Button color="warning" variant="contained" onClick={() => void runRebuild(true)} disabled={running}>
            Fortsett
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default EmbeddingsPage;
