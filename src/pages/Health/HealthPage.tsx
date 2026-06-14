import React, { useEffect, useState } from 'react';
import {
  Container,
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Paper,
  Chip,
  Stack
} from '@mui/material';
import { getHealthStatus } from '../../services/healthService';
import { getAiModels } from '../../services/adminService';
import type { AiModelsResponse, HealthResponse } from '../../types/api';

// A new component to render status with specific text and colors as requested.
const StatusIndicator: React.FC<{ status: unknown; serviceName: string }> = ({ status, serviceName }) => {
  // Normalize status to a boolean `isUp`.
  const isUp = String(status).toUpperCase() === 'UP' || String(status).toUpperCase() === 'TRUE';

  let label = isUp ? "Operasjonell" : "Ingen kontakt";
  const color = isUp ? 'success' : 'error';

  // Special case for genAI_configured as requested.
  if (serviceName === 'genAI_configured' && isUp) {
    label = "Konfigurert riktig";
  }

  return <Chip label={label} color={color} sx={{ fontWeight: 'bold' }} />;
};

const HealthPage: React.FC = () => {
  const [health, setHealth] = useState<HealthResponse | null>(null);
  const [aiModels, setAiModels] = useState<AiModelsResponse | null>(null);
  const [aiModelsError, setAiModelsError] = useState<string | null>(null);

  useEffect(() => {
    getHealthStatus().then(setHealth);
    getAiModels()
      .then(setAiModels)
      .catch(() => setAiModelsError('Kunne ikke hente AI-modellkonfigurasjon.'));
  }, []);

  const details = (health?.details ?? {}) as Record<string, unknown>;

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Systemstatus</Typography>
      <Paper sx={{ p: { xs: 2, md: 3 }, overflowX: 'auto' }}>
        <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Overordnet status:</Typography>
          <Chip
            label={health?.status ?? 'UNKNOWN'}
            color={(health?.status === 'UP') ? 'success' : 'error'}
            sx={{ fontWeight: 'bold', fontSize: '1rem' }}
          />
        </Stack>
        <Table size="medium" sx={{ minWidth: 400 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Tjeneste</TableCell>
              <TableCell sx={{ fontWeight: 'bold', fontSize: '1.1rem' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {Object.entries(details).map(([key, value]) => {
              // Sanitize the key for display purposes.
              const serviceName = key.replace(/_/g, ' ');
              return (
                <TableRow key={key} sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                  <TableCell sx={{ textTransform: 'capitalize', fontWeight: 500 }}>
                    {serviceName}
                  </TableCell>
                  <TableCell>
                    <StatusIndicator status={value} serviceName={key} />
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </Paper>

      <Paper sx={{ p: { xs: 2, md: 3 }, mt: 3, overflowX: 'auto' }}>
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>AI-modeller (admin)</Typography>
        {aiModelsError && (
          <Typography variant="body2" color="text.secondary">{aiModelsError}</Typography>
        )}
        {aiModels && (
          <Table size="medium" sx={{ minWidth: 400 }}>
            <TableBody>
              <TableRow><TableCell sx={{ fontWeight: 500 }}>Provider</TableCell><TableCell>{aiModels.provider}</TableCell></TableRow>
              <TableRow><TableCell sx={{ fontWeight: 500 }}>Rask modell (FAST)</TableCell><TableCell>{aiModels.fastModel}</TableCell></TableRow>
              <TableRow><TableCell sx={{ fontWeight: 500 }}>Standard modell (DEFAULT)</TableCell><TableCell>{aiModels.defaultModel}</TableCell></TableRow>
              <TableRow><TableCell sx={{ fontWeight: 500 }}>Kvalitetsmodell (QUALITY)</TableCell><TableCell>{aiModels.qualityModel}</TableCell></TableRow>
              <TableRow><TableCell sx={{ fontWeight: 500 }}>Kvalitet konfigurert</TableCell><TableCell>{aiModels.qualityConfigured ? 'Ja' : 'Nei'}</TableCell></TableRow>
              <TableRow><TableCell sx={{ fontWeight: 500 }}>Kvalitet faller tilbake til standard</TableCell><TableCell>{aiModels.qualityFallsBackToDefault ? 'Ja' : 'Nei'}</TableCell></TableRow>
            </TableBody>
          </Table>
        )}
      </Paper>
    </Container>
  );
};

export default HealthPage;
