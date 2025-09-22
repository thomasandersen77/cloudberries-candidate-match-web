import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Stack, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { listConsultants } from '../../services/consultantsService';
import type { ConsultantSummaryDto, PageConsultantSummaryDto } from '../../types/api';

const ConsultantsListPage: React.FC = () => {
  const [name, setName] = useState('');
  const [page, setPage] = useState(1); // UI 1-indexed
  const [size, setSize] = useState<number>(10);
  const [data, setData] = useState<PageConsultantSummaryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      // Over-fetch by one to detect if a next page exists even if backend totals are unreliable
      const effectiveSize = Math.min(size + 1, 100);
      const res = await listConsultants({ name, page: page - 1, size: effectiveSize });
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [page, size]);

  const handleSearch = () => {
    // Reset to first page and fetch. If already on page 1, fetch immediately.
    if (page !== 1) {
      setPage(1);
    } else {
      fetchData();
    }
  };

  const content: ConsultantSummaryDto[] = data?.content ?? [];
  const displayContent: ConsultantSummaryDto[] = content.slice(0, size);
  const canPrev = page > 1;
  const canNext = content.length > size; // we over-fetched by one

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Konsulenter</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
        <TextField label="Navn inneholder" value={name} onChange={(e) => setName(e.target.value)} size="small" />
        <Button onClick={handleSearch} variant="contained" disabled={loading}>Søk</Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Navn</TableCell>
              <TableCell>E-post</TableCell>
              <TableCell>Fødselsår</TableCell>
              <TableCell>Default CV ID</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {displayContent.map((c) => (
              <TableRow key={c.userId} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/consultants/${encodeURIComponent(c.userId)}`)}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{c.bornYear}</TableCell>
                <TableCell>{c.defaultCvId}</TableCell>
              </TableRow>
            ))}
            {!loading && displayContent.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>Ingen konsulenter funnet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'relative', zIndex: 10, pointerEvents: 'auto' }}>
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
          <Button variant="outlined" onClick={() => canPrev && setPage((p) => Math.max(1, p - 1))} disabled={!canPrev}>
            Forrige
          </Button>
          <Button variant="outlined" onClick={() => canNext && setPage((p) => p + 1)} disabled={!canNext}>
            Neste
          </Button>
          <Typography variant="body2" sx={{ ml: 1 }}>
            Side {page}
          </Typography>
        </Stack>

        <FormControl size="small" sx={{ minWidth: 180 }}>
          <InputLabel id="rows-per-page-label">Rader per side</InputLabel>
          <Select
            labelId="rows-per-page-label"
            id="rows-per-page"
            value={size}
            label="Rader per side"
            onChange={(e) => { const newSize = Number(e.target.value); setSize(newSize); setPage(1); }}
          >
            {[10, 25, 50, 100].map((s) => (
              <MenuItem key={s} value={s}>{s}</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Container>
  );
};

export default ConsultantsListPage;
