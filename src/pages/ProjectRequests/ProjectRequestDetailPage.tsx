import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Paper, Stack, Typography, Table, TableHead, TableRow, TableCell, TableBody, LinearProgress } from '@mui/material';
import type { ProjectRequestResponseDto, ProjectRequirementDto } from '../../types/api';
import { getProjectRequestById } from '../../services/projectRequestsService';

const ProjectRequestDetailPage: React.FC = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [dto, setDto] = useState<ProjectRequestResponseDto | null>(null);

  useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true);
      try {
        const numeric = Number(id);
        const res = await getProjectRequestById(numeric);
        setDto(res);
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Kundeforspørsel</Typography>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {dto && (
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap' }}>
            <Typography variant="body2"><strong>ID:</strong> {dto.id ?? '-'}</Typography>
            <Typography variant="body2"><strong>Kunde:</strong> {dto.customerName ?? '-'}</Typography>
            <Typography variant="body2"><strong>Tittel:</strong> {dto.title ?? '-'}</Typography>
            <Typography variant="body2"><strong>Filnavn:</strong> {dto.originalFilename ?? '-'}</Typography>
          </Stack>
          {dto.summary && (
            <>
              <Typography variant="subtitle1">Oppsummering</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: 2 }}>{dto.summary}</Typography>
            </>
          )}

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
            <BoxedTable title="Må-krav" rows={dto.mustRequirements ?? []} />
            <BoxedTable title="Bør-krav" rows={dto.shouldRequirements ?? []} />
          </Stack>
        </Paper>
      )}
    </Container>
  );
};

function BoxedTable({ title, rows }: { title: string; rows: ProjectRequirementDto[] }) {
  return (
    <Paper sx={{ p: 1, flex: 1 }}>
      <Typography variant="subtitle1" gutterBottom>{title}</Typography>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Navn</TableCell>
            <TableCell>Detaljer</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows && rows.length > 0 ? (
            rows.map((r, i) => (
              <TableRow key={i}>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.details ?? ''}</TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={2}>
                <Typography variant="body2" color="text.secondary">Ingen krav</Typography>
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </Paper>
  );
}

export default ProjectRequestDetailPage;
