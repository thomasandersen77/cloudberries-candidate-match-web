import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button, Stack } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getAllCandidates } from '../../services/cvScoreService';
import type { CandidateDTO } from '../../types/api';

const CvScoreListPage: React.FC = () => {
  const [candidates, setCandidates] = useState<CandidateDTO[]>([]);
  const [running, setRunning] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getAllCandidates().then(setCandidates);
  }, []);

  return (
    <Container sx={{ py: 4 }}>
      <Stack direction="row" spacing={2} sx={{ alignItems: 'center', mb: 2 }}>
        <Typography variant="h4" gutterBottom sx={{ m: 0 }}>CV-Score (alle)</Typography>
        <Button
          size="small"
          variant="contained"
          disabled={running}
          onClick={async () => {
            try {
              setRunning(true);
              const { runScoreForAll } = await import('../../services/cvScoreService');
              await runScoreForAll();
              // Refresh candidate list (ids same, but detail pages will show updated scores)
              const fresh = await getAllCandidates();
              setCandidates(fresh);
            } finally {
              setRunning(false);
            }
          }}
        >
          {running ? 'Skårer alle…' : 'Kjør scoring for alle'}
        </Button>
      </Stack>
      <Paper sx={{ p: 2 }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell>Navn</TableCell>
              <TableCell>Fødselsår</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {candidates.map((c) => (
              <TableRow key={c.id} hover sx={{ cursor: 'pointer' }} onClick={() => navigate(`/cv-score/${encodeURIComponent(c.id)}`)}>
                <TableCell>{c.name}</TableCell>
                <TableCell>{c.birthYear}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default CvScoreListPage;