import React, { useEffect, useMemo, useState } from 'react';
import { alpha, useTheme } from '@mui/material/styles';
import { Box, Button, Collapse, Container, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, LinearProgress, Paper, Stack, Typography, Table, TableBody, TableCell, TableHead, TableRow, Alert, TableSortLabel } from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { ProjectRequestResponseDto, ProjectRequirementDto } from '../../types/api';
import { uploadProjectRequest, listProjectRequestsPaged, getProjectRequestById, deleteProjectRequest } from '../../services/projectRequestsService';

const ProjectRequestUploadPage: React.FC = () => {
  const theme = useTheme();
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progressVisible, setProgressVisible] = useState(false);
  const [result, setResult] = useState<ProjectRequestResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [existing, setExisting] = useState<ProjectRequestResponseDto[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [openingId, setOpeningId] = useState<number | null>(null);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [detailsById, setDetailsById] = useState<Record<number, ProjectRequestResponseDto>>({});
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ id: number; label: string } | null>(null);
  const [sortField, setSortField] = useState<'uploadedAt' | 'customerName' | 'summary' | 'deadlineDate' | 'status'>('uploadedAt');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');

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
    } catch (err: unknown) {
      const anyErr = err as { response?: { data?: { message?: string } } ; message?: string };
      const msg = anyErr?.response?.data?.message || anyErr?.message || 'Ukjent feil ved opplasting/analyse';
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
      } catch {
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

  const onOpenDetails = async (id: number) => {
    // Toggle: clicking an already-open row collapses it.
    if (expandedId === id) {
      setExpandedId(null);
      return;
    }
    setError(null);
    // Use cached details when available; otherwise fetch once.
    if (detailsById[id]) {
      setExpandedId(id);
      return;
    }
    setOpeningId(id);
    try {
      const dto = await getProjectRequestById(id);
      if (dto) {
        setDetailsById((prev) => ({ ...prev, [id]: dto }));
        setExpandedId(id);
      }
    } catch {
      setError('Kunne ikke hente detaljer for valgt forespørsel.');
    } finally {
      setOpeningId(null);
    }
  };

  const requestDelete = (id: number, label: string) => {
    setPendingDelete({ id, label });
  };

  const cancelDelete = () => {
    if (deletingId != null) return;
    setPendingDelete(null);
  };

  const confirmDelete = async () => {
    if (!pendingDelete) return;
    const { id } = pendingDelete;
    setDeletingId(id);
    setError(null);
    try {
      await deleteProjectRequest(id);
      setExisting((prev) => prev.filter((r) => r.id !== id));
      setDetailsById((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      if (expandedId === id) setExpandedId(null);
      if (result?.id === id) setResult(null);
      setPendingDelete(null);
    } catch {
      setError('Kunne ikke slette forespørselen. Prøv igjen senere.');
    } finally {
      setDeletingId(null);
    }
  };

  const handleSort = (field: 'uploadedAt' | 'customerName' | 'summary' | 'deadlineDate' | 'status') => {
    if (sortField === field) {
      setSortDir(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir(field === 'uploadedAt' ? 'desc' : 'asc');
    }
  };

  return (
    <Container sx={{ py: { xs: 2, md: 4 } }}>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, letterSpacing: '-0.02em', mb: 1 }}>
        Last opp kundeforspørsel (PDF)
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 760, lineHeight: 1.7, fontSize: { xs: '1.02rem', md: '1.06rem' } }}>
        Her kan du laste opp en kundeforspørsel i PDF-format. Dokumentet vil analyseres av en AI, lagres i databasen,
        og resultatet vises under. Dette kan ta litt tid, så vent til analysen er ferdig.
      </Typography>

      <Paper elevation={0} sx={{ p: { xs: 2, md: 3 }, mb: 3, overflow: 'hidden' }}>
        <Box
          sx={{
            p: { xs: 2, sm: 2.5 },
            borderRadius: 2,
            border: `1px dashed ${theme.palette.divider}`,
            bgcolor: theme.palette.mode === 'light' ? alpha('#111111', 0.02) : alpha('#fff', 0.03),
          }}
        >
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} justifyContent="space-between">
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems={{ xs: 'stretch', sm: 'center' }} sx={{ flex: 1, minWidth: 0 }}>
              <Button variant="outlined" color="primary" component="label" startIcon={<UploadFileIcon />} disabled={uploading}>
                Velg PDF
                <input type="file" accept="application/pdf" hidden onChange={onFileChange} />
              </Button>
              <Typography variant="body2" color="text.secondary" sx={{ flex: 1, wordBreak: 'break-word' }}>
                {file ? file.name : 'Ingen fil valgt'}
              </Typography>
            </Stack>
            <Button variant="contained" color="primary" onClick={onUpload} disabled={!file || !isPdf || uploading}>
              Analyser og lagre
            </Button>
          </Stack>
        </Box>

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

      <Paper elevation={0} sx={{ p: { xs: 2, md: 2.5 }, mb: 3, overflow: 'hidden' }}>
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 1 }}>
          <Typography variant="h6" sx={{ m: 0, flex: 1, fontWeight: 600, letterSpacing: '-0.01em' }}>
            Eksisterende forespørsler
          </Typography>
          {loadingList && <LinearProgress sx={{ flex: 1, maxWidth: 200 }} />}
        </Stack>
        <Table size="medium" stickyHeader>
          <TableHead>
            <TableRow>
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
              <TableCell width={170}>Handlinger</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedExisting.map((r) => {
              const isExpanded = r.id != null && expandedId === r.id;
              const detail = r.id != null ? detailsById[r.id] : undefined;
              return (
                <React.Fragment key={r.id ?? Math.random()}>
                  <TableRow
                    hover
                    selected={isExpanded}
                    sx={{ cursor: r.id ? 'pointer' : 'default', '& > *': { borderBottom: isExpanded ? 'unset' : undefined } }}
                    onClick={() => {
                      if (r.id != null) onOpenDetails(r.id);
                    }}
                  >
                    <TableCell>{r.uploadedAt ? new Date(r.uploadedAt).toLocaleString('no-NO') : '-'}</TableCell>
                    <TableCell>{r.customerName ?? '-'}</TableCell>
                    <TableCell>{r.summary ? (r.summary.length > 120 ? r.summary.slice(0, 120) + '…' : r.summary) : '-'}</TableCell>
                    <TableCell>{(r as unknown as { status?: string }).status ?? '-'}</TableCell>
                    <TableCell>{r.deadlineDate ? new Date(r.deadlineDate).toLocaleDateString('no-NO') : '-'}</TableCell>
                    <TableCell>
                      <Stack direction="row" spacing={0.5}>
                        <Button
                          size="small"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (r.id != null) onOpenDetails(r.id);
                          }}
                          disabled={r.id == null || openingId === r.id}
                        >
                          {openingId === r.id ? 'Åpner…' : isExpanded ? 'Lukk' : 'Åpne'}
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<DeleteOutlineIcon />}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (r.id != null) requestDelete(r.id, r.customerName || r.title || `#${r.id}`);
                          }}
                          disabled={r.id == null || deletingId === r.id}
                        >
                          {deletingId === r.id ? 'Sletter…' : 'Slett'}
                        </Button>
                      </Stack>
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell colSpan={6} sx={{ py: 0, borderBottom: isExpanded ? undefined : 'none' }}>
                      <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                        <Box sx={{ py: 2 }}>
                          {detail ? (
                            <ProjectRequestDetails
                              dto={detail}
                              deleting={r.id != null && deletingId === r.id}
                              onDelete={r.id != null ? () => requestDelete(r.id as number, r.customerName || r.title || `#${r.id}`) : undefined}
                            />
                          ) : null}
                        </Box>
                      </Collapse>
                    </TableCell>
                  </TableRow>
                </React.Fragment>
              );
            })}
            {(!sortedExisting || sortedExisting.length === 0) && (
              <TableRow>
                <TableCell colSpan={6}>
                  <Typography variant="body2" color="text.secondary">Ingen forespørsler funnet.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Paper>

      {result && (
        <Paper elevation={0} sx={{ p: { xs: 2, md: 3 } }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, letterSpacing: '-0.01em' }}>
            Resultat
          </Typography>
          <ProjectRequestDetails
            dto={result}
            deleting={result.id != null && deletingId === result.id}
            onDelete={result.id != null ? () => requestDelete(result.id as number, result.customerName || result.title || `#${result.id}`) : undefined}
          />
        </Paper>
      )}

      <Dialog
        open={pendingDelete != null}
        onClose={cancelDelete}
        aria-labelledby="delete-request-title"
        aria-describedby="delete-request-description"
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle id="delete-request-title" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <WarningAmberIcon color="error" />
          Slette prosjektforespørsel?
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="delete-request-description" component="div">
            Du er i ferd med å slette
            {pendingDelete ? <strong> «{pendingDelete.label}»</strong> : ' forespørselen'}.
            <Box component="p" sx={{ mt: 1.5, mb: 0 }}>
              Denne forespørselen kan være knyttet til matchende konsulenter. Sletting fjerner
              forespørselen og tilknyttede matcher permanent, og <strong>kan ikke angres</strong>.
            </Box>
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={cancelDelete} disabled={deletingId != null} color="inherit">
            Avbryt
          </Button>
          <Button
            onClick={confirmDelete}
            color="error"
            variant="contained"
            startIcon={<DeleteOutlineIcon />}
            disabled={deletingId != null}
          >
            {deletingId != null ? 'Sletter…' : 'Slett forespørsel'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

function ProjectRequestDetails({
  dto,
  onDelete,
  deleting = false,
}: {
  dto: ProjectRequestResponseDto;
  onDelete?: () => void;
  deleting?: boolean;
}) {
  const displayTitle = deriveDisplayTitle(dto);
  return (
    <>
      <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
        <Typography variant="body2"><strong>ID:</strong> {dto.id ?? '-'}</Typography>
        <Typography variant="body2"><strong>Filnavn:</strong> {dto.originalFilename ?? '-'}</Typography>
        <Typography variant="body2"><strong>Kunde:</strong> {dto.customerName ?? '-'}</Typography>
        <Typography variant="body2"><strong>Tittel:</strong> {displayTitle}</Typography>
      </Stack>
      {dto.summary && (
        <Box sx={{ mb: 2 }}>
          <Typography
            variant="subtitle1"
            sx={{
              fontWeight: 700,
              mb: 0.5,
              textTransform: 'uppercase',
              letterSpacing: '0.06em',
              color: 'text.secondary',
            }}
          >
            Oppsummering
          </Typography>
          <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{dto.summary}</Typography>
        </Box>
      )}

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
        <Typography variant="body2"><strong>Analysert:</strong> {dto.uploadedAt ? new Date(dto.uploadedAt).toLocaleString('no-NO') : '-'}</Typography>
        <Typography variant="body2"><strong>Svarfrist:</strong> {dto.deadlineDate ? new Date(dto.deadlineDate).toLocaleDateString('no-NO') : '-'}</Typography>
      </Stack>

      <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
        <RequirementPanel title="Må-krav" rows={dto.mustRequirements ?? []} tone="must" />
        <RequirementPanel title="Bør-krav" rows={dto.shouldRequirements ?? []} tone="should" />
      </Stack>

      {onDelete && (
        <Stack direction="row" justifyContent="flex-end" sx={{ mt: 2 }}>
          <Button
            color="error"
            variant="outlined"
            startIcon={<DeleteOutlineIcon />}
            onClick={onDelete}
            disabled={deleting}
          >
            {deleting ? 'Sletter…' : 'Slett forespørsel'}
          </Button>
        </Stack>
      )}
    </>
  );
}

function RequirementPanel({
  title,
  rows,
  tone,
}: {
  title: string;
  rows: ProjectRequirementDto[];
  tone: 'must' | 'should';
}) {
  const isMust = tone === 'must';
  if (!rows || rows.length === 0) {
    return (
      <Paper sx={{ p: 2, flex: 1 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          {title}
        </Typography>
        <Typography variant="body2">Ingen krav funnet.</Typography>
      </Paper>
    );
  }
  return (
    <Paper
      sx={(theme) => ({
        p: 2,
        flex: 1,
        borderColor: isMust ? alpha(theme.palette.primary.main, 0.28) : alpha(theme.palette.secondary.main, 0.32),
        backgroundColor: isMust ? alpha(theme.palette.primary.main, 0.04) : alpha(theme.palette.secondary.main, 0.045),
      })}
    >
      <Typography
        variant="subtitle2"
        sx={(theme) => ({
          mb: 1.25,
          fontWeight: 700,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: isMust ? theme.palette.primary.main : theme.palette.secondary.main,
        })}
      >
        {title}
      </Typography>
      <Stack spacing={1.25}>
        {rows.map((r, i) => (
          <Box
            key={i}
            sx={(theme) => ({
              px: 1.25,
              py: 0.9,
              borderRadius: 1.25,
              border: `1px solid ${isMust ? alpha(theme.palette.primary.main, 0.28) : alpha(theme.palette.secondary.main, 0.28)}`,
              bgcolor: isMust ? alpha(theme.palette.primary.main, 0.1) : alpha(theme.palette.secondary.main, 0.1),
            })}
          >
            <Typography
              variant="body2"
              sx={{
                fontWeight: 600,
                lineHeight: 1.45,
                whiteSpace: 'normal',
                overflowWrap: 'anywhere',
              }}
            >
              {r.name}
            </Typography>
            {r.details ? (
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ display: 'block', mt: 0.45, lineHeight: 1.45, whiteSpace: 'normal', overflowWrap: 'anywhere' }}
              >
                {r.details}
              </Typography>
            ) : null}
          </Box>
        ))}
      </Stack>
    </Paper>
  );
}

function deriveDisplayTitle(result: ProjectRequestResponseDto | null): string {
  if (!result) return '-';
  const title = (result.title ?? '').trim();
  if (title.length >= 14) return title;
  const summary = (result.summary ?? '').replace(/\s+/g, ' ').trim();
  if (!summary) return title || '-';
  const firstSentence = summary.split(/[.!?]/).find((s) => s.trim().length > 18)?.trim() ?? summary;
  const normalized = firstSentence.charAt(0).toUpperCase() + firstSentence.slice(1);
  if (result.customerName) return `${result.customerName}: ${normalized}`;
  return normalized;
}

export default ProjectRequestUploadPage;
