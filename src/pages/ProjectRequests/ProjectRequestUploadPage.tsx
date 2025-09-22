import React, { useMemo, useState } from 'react';
import { Box, Button, Container, LinearProgress, Paper, Stack, Typography, Table, TableBody, TableCell, TableHead, TableRow, Alert } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import type { ProjectRequestResponseDto, ProjectRequirementDto } from '../../types/api';
import { uploadProjectRequest } from '../../services/projectRequestsService';

const ProjectRequestUploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);
  const [result, setResult] = useState<ProjectRequestResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isPdf = useMemo(() => (file?.type === 'application/pdf') || (file?.name?.toLowerCase().endsWith('.pdf')), [file]);

  const onFileChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    setError(null);
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  const onUpload = async () => {
    if (!file) { setError('Velg en PDF først.'); return; }
    if (!isPdf) { setError('Filen må være i PDF-format.'); return; }
    setUploading(true);
    setProgressVisible(true);
    setResult(null);
    setError(null);
    try {
      const res = await uploadProjectRequest(file);
      setResult(res);
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Ukjent feil ved opplasting/analyse';
      setError(String(msg));
    } finally {
      setUploading(false);
      // keep progress bar visible briefly to avoid flicker
      setTimeout(() => setProgressVisible(false), 400);
    }
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Last opp kundeforspørsel (PDF)</Typography>
      <Typography variant="body1" sx={{ mb: 2 }}>
        Her kan du laste opp en kundeforspørsel i PDF-format. Dokumentet vil analyseres av en AI, lagres i databasen,
        og resultatet vises under. Dette kan ta litt tid, så vent til analysen er ferdig.
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
          <Button
            variant="outlined"
            component="label"
            startIcon={<UploadFileIcon />}
            disabled={uploading}
          >
            Velg PDF
            <input type="file" accept="application/pdf" hidden onChange={onFileChange} />
          </Button>
          <Typography variant="body2" sx={{ flex: 1 }}>
            {file ? file.name : 'Ingen fil valgt'}
          </Typography>
          <Button variant="contained" onClick={onUpload} disabled={!file || !isPdf || uploading}>
            Analyser og lagre
          </Button>
        </Stack>

        {progressVisible && (
          <Box sx={{ mt: 2 }}>
            <LinearProgress />
            <Typography variant="caption" sx={{ display: 'block', mt: 1 }}>
              Analyserer dokumentet. Dette kan ta noen sekunder...
            </Typography>
          </Box>
        )}

        {error && (
          <Alert sx={{ mt: 2 }} severity="error">{error}</Alert>
        )}
      </Paper>

      {result && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" gutterBottom>Resultat</Typography>
          <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2"><strong>ID:</strong> {result.id ?? '-'}</Typography>
            <Typography variant="body2"><strong>Filnavn:</strong> {result.originalFilename ?? '-'}</Typography>
            <Typography variant="body2"><strong>Kunde:</strong> {result.customerName ?? '-'}</Typography>
            <Typography variant="body2"><strong>Tittel:</strong> {result.title ?? '-'}</Typography>
          </Stack>
          {result.summary && (
            <Box sx={{ mb: 2 }}>
              <Typography variant="subtitle1">Oppsummering</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{result.summary}</Typography>
            </Box>
          )}

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" gutterBottom>Må-krav</Typography>
              <RequirementsTable rows={result.mustRequirements ?? []} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" gutterBottom>Bør-krav</Typography>
              <RequirementsTable rows={result.shouldRequirements ?? []} />
            </Box>
          </Stack>
        </Paper>
      )}
    </Container>
  );
};

function RequirementsTable({ rows }: { rows: ProjectRequirementDto[] }) {
  if (!rows || rows.length === 0) {
    return <Typography variant="body2">Ingen krav funnet.</Typography>;
  }
  return (
    <Table size="small" stickyHeader>
      <TableHead>
        <TableRow>
          <TableCell>Navn</TableCell>
          <TableCell>Detaljer</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {rows.map((r, i) => (
          <TableRow key={i}>
            <TableCell>{r.name}</TableCell>
            <TableCell>{r.details ?? ''}</TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

export default ProjectRequestUploadPage;