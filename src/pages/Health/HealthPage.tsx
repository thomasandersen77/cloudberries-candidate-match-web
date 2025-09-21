import React, { useEffect, useState } from 'react';
import { Container, Typography, Table, TableHead, TableRow, TableCell, TableBody, Paper, Chip, Stack } from '@mui/material';
import { getHealthStatus } from '../../services/healthService';
import type { HealthResponse } from '../../types/api';

const HealthPage: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);

  useEffect(() => {
    getHealthStatus().then(setHealth);
  }, []);

  const details = (health?.details ?? {}) as Record<string, any>;

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Systemstatus</Typography>
      <Paper sx={{ p: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
          <Typography>Overordnet status:</Typography>
          <Chip label={health?.status ?? 'UNKNOWN'} color={(health?.status === 'UP') ? 'success' : 'error'} variant="outlined" />
        </Stack>
        <Table size="small" stickyHeader sx={{ mt: 1 }}>
          <TableHead>
            <TableRow>
              <TableCell>Tjeneste</TableCell>
              <TableCell>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(details).map(([k, v]) => {
              const status = String(v).toUpperCase();
              const isUp = status === 'UP';
              return (
                <TableRow key={k}>
                  <TableCell>{k}</TableCell>
                  <TableCell>
                    <Chip label={status} color={isUp ? 'success' : 'error'} size="small" variant="outlined" />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>
    </Container>
  );
};

export default HealthPage;