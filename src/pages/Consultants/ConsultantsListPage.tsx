import React, { useEffect, useState } from 'react';
import { Box, Container, Typography, TextField, Button, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Pagination, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { listConsultants } from '../../services/consultantsService';
import type { ConsultantSummaryDto, PageConsultantSummaryDto } from '../../types/api';

const ConsultantsListPage: React.FC = () => {
  const [name, setName] = useState('');
  const [page, setPage] = useState(1); // UI 1-indexed
  const [size] = useState(10);
  const [data, setData] = useState<PageConsultantSummaryDto | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await listConsultants({ name, page: page - 1, size });
      setData(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); /* eslint-disable-next-line */ }, [page]);

  const handleSearch = () => { setPage(1); /* fetch will run via effect */ };

  const content: ConsultantSummaryDto[] = data?.content ?? [];

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Konsulenter</Typography>
      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
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
            {content.map((c) => (
              <TableRow key={c.userId} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/consultants/${encodeURIComponent(c.userId)}`)}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.email}</TableCell>
                <TableCell>{c.bornYear}</TableCell>
                <TableCell>{c.defaultCvId}</TableCell>
              </TableRow>
            ))}
            {!loading && content.length === 0 && (
              <TableRow>
                <TableCell colSpan={4}>Ingen konsulenter funnet.</TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Box sx={{ mt: 2, display: 'flex', justifyContent: 'center' }}>
        <Pagination count={data?.totalPages ?? 0} page={page} onChange={(_, p) => { setPage(p); }} />
      </Box>
    </Container>
  );
};

export default ConsultantsListPage;