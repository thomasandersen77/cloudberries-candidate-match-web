import React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import type { WorkExperienceDto } from '../../types/api';

interface WorkHistoryTableProps {
  workExperience: WorkExperienceDto[];
}

const formatYearMonth = (yearMonth: string | null | undefined): string => {
  if (!yearMonth) return '';
  // Assuming format YYYY-MM or similar
  const [year, month] = yearMonth.split('-');
  if (month) {
    return `${month}/${year}`;
  }
  return year || '';
};

const sortWorkExperience = (experiences: WorkExperienceDto[]): WorkExperienceDto[] => {
  return experiences.slice().sort((a, b) => {
    // Sort by toYearMonth (most recent first), then by fromYearMonth
    const aTo = a.toYearMonth || '';
    const bTo = b.toYearMonth || '';
    
    if (aTo !== bTo) {
      return bTo.localeCompare(aTo); // Descending order for most recent first
    }
    
    const aFrom = a.fromYearMonth || '';
    const bFrom = b.fromYearMonth || '';
    return bFrom.localeCompare(aFrom);
  });
};

const WorkHistoryTable: React.FC<WorkHistoryTableProps> = ({ workExperience }) => {
  if (!workExperience || workExperience.length === 0) {
    return (
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Arbeidshistorikk
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ingen arbeidserfaring tilgjengelig
        </Typography>
      </Paper>
    );
  }

  const sortedExperience = sortWorkExperience(workExperience);

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Arbeidshistorikk
      </Typography>
      <TableContainer>
        <Table size="medium">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Arbeidsgiver</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Fra</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Til</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedExperience.map((experience, index) => (
              <TableRow key={index} hover>
                <TableCell component="th" scope="row">
                  {experience.employer || 'Ikke oppgitt'}
                </TableCell>
                <TableCell>
                  {formatYearMonth(experience.fromYearMonth)}
                </TableCell>
                <TableCell>
                  {experience.toYearMonth ? formatYearMonth(experience.toYearMonth) : 'Pågående'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default WorkHistoryTable;