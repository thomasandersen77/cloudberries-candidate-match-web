import React, { useEffect, useMemo, useState } from 'react';
import { Box, Button, Container, LinearProgress, Paper, Stack, Typography, Table, TableBody, TableCell, TableHead, TableRow, Alert, Chip, Toolbar, Checkbox, TableSortLabel } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import type { ProjectRequestResponseDto, ProjectRequirementDto } from '../../types/api';
import { uploadProjectRequest, listProjectRequestsPaged } from '../../services/projectRequestsService';
import { useNavigate } from 'react-router-dom';

const ProjectRequestUploadPage: React.FC = () => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);
  const [result, setResult] = useState<ProjectRequestResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<ProjectRequestResponseDto[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [sortField, setSortField] = useState<'uploadedAt' | 'customerName' | 'summary' | 'deadlineDate' | 'status'>('uploadedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const navigate = useNavigate();

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
      // Refresh existing list after successful upload
      try {
        setLoadingList(true);
        const page = await listProjectRequestsPaged({ page: 0, size: 20, sort: 'id,desc' });
        const list = page.content ?? [];
        setExisting(list);
      } finally {
        setLoadingList(false);
      }
    } catch (err: any) {
      const msg = err?.response?.data?.message || err?.message || 'Ukjent feil ved opplasting/analyse';
      setError(String(msg));
    } finally {
      setUploading(false);
      // keep progress bar visible briefly to avoid flicker
      setTimeout(() => setProgressVisible(false), 400);
    }
  };

  useEffect(() => {
    (async () => {
      try {
        setLoadingList(true);
        const page = await listProjectRequestsPaged({ page: 0, size: 50, sort: 'id,desc' });
        setExisting(page.content ?? []);
      } catch (e) {
        // silently ignore list errors
      } finally {
        setLoadingList(false);
      }
    })();
  }, []);

  const sortedExisting = useMemo(() => {
    const arr = [...(existing ?? [])];
    const collator = new Intl.Collator('no-NO', { sensitivity: 'base' });
    arr.sort((a, b) => {
      const dir = sortDir === 'asc' ? 1 : -1;
      const get = (r: ProjectRequestResponseDto): unknown => {
        if (sortField === 'uploadedAt') return r.uploadedAt ? new Date(r.uploadedAt).getTime() : 0;
        if (sortField === 'customerName') return (r.customerName ?? '').toString();
        if (sortField === 'summary') return (r.summary ?? '').toString();
        if (sortField === 'deadlineDate') return r.deadlineDate ? new Date(r.deadlineDate).getTime() : 0;
        if (sortField === 'status') return ((r as unknown as { status?: string }).status ?? '').toString();
        return 0;
      };
      const va = get(a);
      const vb = get(b);
      if (typeof va === 'number' && typeof vb === 'number') return dir * (va - vb);
      return dir * collator.compare(String(va), String(vb));
    });
    return arr;
  }, [existing, sortField, sortDir]);

  const handleSort = (field: 'uploadedAt' | 'customerName' | 'summary' | 'deadlineDate' | 'status') => {
    if (sortField === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'uploadedAt' ? 'desc' : 'asc');
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

      {/* Existing project requests list (compact) */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
          <Typography variant="h6" sx={{ m: 0, flex: 1 }}>Eksisterende forespørsler</Typography>
          {loadingList && <LinearProgress sx={{ flex: 1 }} />}
        </Stack>
        <Toolbar disableGutters sx={{ mt: 1, mb: 1 }}>
          <Button
            variant="outlined"
            size="small"
            disabled={selectedIds.length === 0}
            onClick={() => {
              // Open selected details in new tabs
              selectedIds.forEach(id => window.open(`/project-requests/${id}`, '_blank'));
            }}
          >
            Se detaljer ({selectedIds.length})
          </Button>
        </Toolbar>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox">
                <Checkbox
                  indeterminate={selectedIds.length > 0 && selectedIds.length < (existing.filter(e => e.id != null).length)}
                  checked={existing.filter(e => e.id != null).length > 0 && selectedIds.length === existing.filter(e => e.id != null).length}
                  onChange={(e) => {
                    const allIds = existing.map(e => e.id).filter((v): v is number => typeof v === 'number');
                    if (e.target.checked) setSelectedIds(allIds);
                    else setSelectedIds([]);
                  }}
                  inputProps={{ 'aria-label': 'Velg alle' }}
                />
              </TableCell>
              <TableCell sortDirection={sortField === 'uploadedAt' ? sortDir : false}>
                <TableSortLabel
                  active={sortField === 'uploadedAt'}
                  direction={sortField === 'uploadedAt' ? sortDir : 'asc'}
                  onClick={() => handleSort('uploadedAt')}
                >
                  Opplastet
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortField === 'customerName' ? sortDir : false}>
                <TableSortLabel
                  active={sortField === 'customerName'}
                  direction={sortField === 'customerName' ? sortDir : 'asc'}
                  onClick={() => handleSort('customerName')}
                >
                  Kunde
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortField === 'summary' ? sortDir : false}>
                <TableSortLabel
                  active={sortField === 'summary'}
                  direction={sortField === 'summary' ? sortDir : 'asc'}
                  onClick={() => handleSort('summary')}
                >
                  Oppsummering
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortField === 'status' ? sortDir : false}>
                <TableSortLabel
                  active={sortField === 'status'}
                  direction={sortField === 'status' ? sortDir : 'asc'}
                  onClick={() => handleSort('status')}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortField === 'deadlineDate' ? sortDir : false}>
                <TableSortLabel
                  active={sortField === 'deadlineDate'}
                  direction={sortField === 'deadlineDate' ? sortDir : 'asc'}
                  onClick={() => handleSort('deadlineDate')}
                >
                  Svarfrist
                </TableSortLabel>
              </TableCell>
              <TableCell width={110}>Detaljer</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedExisting.map((r) => (
              <TableRow
                key={r.id ?? Math.random()}
                hover
                selected={r.id != null && selectedIds.includes(r.id)}
                sx={{ cursor: r.id ? 'pointer' : 'default' }}
                onClick={() => {
                  if (r.id != null) {
                    setSelectedIds(prev => prev.includes(r.id!) ? prev.filter(id => id !== r.id) : [...prev, r.id!]);
                  }
                }}
                onDoubleClick={() => { if (r.id != null) navigate(`/project-requests/${r.id}`); }}
              >
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={r.id != null && selectedIds.includes(r.id)}
                    onChange={(e) => {
                      if (r.id == null) return;
                      setSelectedIds(prev => e.target.checked ? [...prev, r.id!] : prev.filter(id => id !== r.id));
                    }}
                    onClick={(e) => e.stopPropagation()}
                    inputProps={{ 'aria-label': `Velg ${r.id}` }}
                  />
                </TableCell>
                <TableCell>{r.uploadedAt ? new Date(r.uploadedAt).toLocaleString('no-NO') : '-'}</TableCell>
                <TableCell>{r.customerName ?? '-'}</TableCell>
                <TableCell>{r.summary ? (r.summary.length > 120 ? r.summary.slice(0, 120) + '…' : r.summary) : '-'}</TableCell>
                <TableCell>{(r as unknown as { status?: string }).status ?? '-'}</TableCell>
                <TableCell>{r.deadlineDate ? new Date(r.deadlineDate).toLocaleDateString('no-NO') : '-'}</TableCell>
                <TableCell>
                  <Button size="small" onClick={(e) => { e.stopPropagation(); if (r.id != null) navigate(`/project-requests/${r.id}`); }}>
                    Åpne
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {(!sortedExisting || sortedExisting.length === 0) && (
              <TableRow>
                <TableCell colSpan={7}>
                  <Typography variant="body2" color="text.secondary">Ingen forespørsler funnet.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
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

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <Typography variant="body2"><strong>Opplastet:</strong> {result.uploadedAt ? new Date(result.uploadedAt).toLocaleString('no-NO') : '-'}</Typography>
            <Typography variant="body2"><strong>Svarfrist:</strong> {result.deadlineDate ? new Date(result.deadlineDate).toLocaleDateString('no-NO') : '-'}</Typography>
          </Stack>

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" gutterBottom>Må-krav</Typography>
              <RequirementsChips rows={result.mustRequirements ?? []} />
            </Box>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" gutterBottom>Bør-krav</Typography>
              <RequirementsChips rows={result.shouldRequirements ?? []} />
            </Box>
          </Stack>
        </Paper>
      )}
    </Container>
  );
};

function RequirementsChips({ rows }: { rows: ProjectRequirementDto[] }) {
  if (!rows || rows.length === 0) {
    return <Typography variant="body2">Ingen krav funnet.</Typography>;
  }
  return (
    <Stack spacing={1}>
      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
        {rows.map((r, i) => (
          <Chip key={i} label={r.name} size="small" />
        ))}
      </Stack>
      {/* Optional bullet list for details */}
      <Box component="ul" sx={{ pl: 3, m: 0 }}>
        {rows.filter(r => r.details).map((r, i) => (
          <li key={i}>
            <Typography variant="body2" color="text.secondary">{r.details}</Typography>
          </li>
        ))}
      </Box>
    </Stack>
  );
}

export default ProjectRequestUploadPage;
