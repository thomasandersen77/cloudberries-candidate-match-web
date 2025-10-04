import React, { useEffect, useState } from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, CircularProgress, Stack } from '@mui/material';
import { getLanguageStats, getRoleStats } from '../../services/analyticsService';

// Local types to avoid depending on codegen refresh
interface ProgrammingLanguageStat {
  language: string;
  consultantCount: number;
  percentage: number; // 0-100
  aggregatedYears: number;
}

interface RoleStat {
  role: string;
  consultantCount: number;
  percentage: number; // 0-100
}

const StatsPage: React.FC = () => {
  const [langs, setLangs] = useState<ProgrammingLanguageStat[] | null>(null);
  const [roles, setRoles] = useState<RoleStat[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [l, r] = await Promise.all([
          getLanguageStats(),
          getRoleStats(),
        ]);
        setLangs(l);
        setRoles(r);
      } catch (e: any) {
        setError(e?.message ?? 'Kunne ikke hente statistikk');
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  return (
    <Box sx={{ py: 2 }}>
      <Typography variant="h4" gutterBottom>
        Analytics & Stats
      </Typography>

      {loading && (
        <Stack direction="row" alignItems="center" spacing={1} sx={{ my: 2 }}>
          <CircularProgress size={20} />
          <Typography variant="body2">Laster...</Typography>
        </Stack>
      )}

      {error && (
        <Typography color="error" sx={{ my: 2 }}>{error}</Typography>
      )}

      {!loading && !error && (
        <Stack spacing={3}>
          <Box>
            <Typography variant="h6" gutterBottom>
              Programming languages
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Language</TableCell>
                    <TableCell align="right">Number of consultants</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                    <TableCell align="right">Aggregated years</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(langs ?? []).map((row) => (
                    <TableRow key={row.language}>
                      <TableCell>{row.language}</TableCell>
                      <TableCell align="right">{row.consultantCount}</TableCell>
                      <TableCell align="right">{row.percentage.toFixed(1)}%</TableCell>
                      <TableCell align="right">{row.aggregatedYears}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          <Box>
            <Typography variant="h6" gutterBottom>
              Roles
            </Typography>
            <TableContainer component={Paper} variant="outlined">
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Role</TableCell>
                    <TableCell align="right">Number of consultants</TableCell>
                    <TableCell align="right">Percentage</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(roles ?? []).map((row) => (
                    <TableRow key={row.role}>
                      <TableCell>{row.role}</TableCell>
                      <TableCell align="right">{row.consultantCount}</TableCell>
                      <TableCell align="right">{row.percentage.toFixed(1)}%</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>
        </Stack>
      )}
    </Box>
  );
};

export default StatsPage;