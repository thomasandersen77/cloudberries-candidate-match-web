import React, { useEffect, useState } from 'react';
import { Container, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { getAllCandidates } from '../../services/cvScoreService';
import type { CandidateDTO } from '../../types/api';

const CvScoreListPage: React.FC = () => {
  const [candidates, setCandidates] = useState<CandidateDTO[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    getAllCandidates().then(setCandidates);
  }, []);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>CV-Score (alle)</Typography>
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