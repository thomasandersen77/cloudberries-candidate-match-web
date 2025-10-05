import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Paper, Stack, Typography, Table, TableHead, TableRow, TableCell, TableBody, LinearProgress, Button, Box, Chip } from '@mui/material';
import type { ProjectRequestResponseDto, ProjectRequirementDto } from '../../types/api';
import { getProjectRequestById, analyzeProjectRequest, getProjectRequestSuggestions, closeProjectRequest } from '../../services/projectRequestsService';

const ProjectRequestDetailPage: React.FC = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [dto, setDto] = useState<ProjectRequestResponseDto | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ consultantName: string; userId: string; cvId: string; matchScore: number; justification: string; createdAt: string; skills?: string[] }>>([]);
  const [actionsLoading, setActionsLoading] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true);
      try {
        const numeric = Number(id);
        const res = await getProjectRequestById(numeric);
        setDto(res);
        try {
          const sugg = await getProjectRequestSuggestions(numeric);
          setSuggestions(sugg ?? []);
        } catch {
          // ignore
        }
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
          <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="body2"><strong>ID:</strong> {dto.id ?? '-'}</Typography>
            <Typography variant="body2"><strong>Kunde:</strong> {dto.customerName ?? '-'}</Typography>
            <Typography variant="body2"><strong>Tittel:</strong> {dto.title ?? '-'}</Typography>
            <Typography variant="body2"><strong>Filnavn:</strong> {dto.originalFilename ?? '-'}</Typography>
            <Typography variant="body2"><strong>Status:</strong> {(dto as unknown as { status?: string }).status ?? '-'}</Typography>
            <Typography variant="body2"><strong>Opplastet:</strong> {dto.uploadedAt ? new Date(dto.uploadedAt).toLocaleString('no-NO') : '-'}</Typography>
            <Typography variant="body2"><strong>Svarfrist:</strong> {dto.deadlineDate ? new Date(dto.deadlineDate).toLocaleDateString('no-NO') : '-'}</Typography>
            <Box sx={{ flex: 1 }} />
            <Button size="small" variant="outlined" disabled={actionsLoading || !dto.id} onClick={async () => {
              if (!dto?.id) return;
              setActionsLoading(true);
              try {
                await analyzeProjectRequest(dto.id);
                const sugg = await getProjectRequestSuggestions(dto.id);
                setSuggestions(sugg ?? []);
              } finally {
                setActionsLoading(false);
              }
            }}>Analyser (AI)</Button>
            <Button size="small" color="error" variant="outlined" disabled={actionsLoading || !dto.id} onClick={async () => {
              if (!dto?.id) return;
              setActionsLoading(true);
              try {
                await closeProjectRequest(dto.id);
              } finally {
                setActionsLoading(false);
              }
            }}>Lukk forespørsel</Button>
          </Stack>
          {dto.summary && (
            <>
              <Typography variant="subtitle1">Oppsummering</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: 2 }}>{dto.summary}</Typography>
            </>
          )}

          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} sx={{ mb: 2 }}>
            <BoxedChips title="Må-krav" rows={dto.mustRequirements ?? []} />
            <BoxedChips title="Bør-krav" rows={dto.shouldRequirements ?? []} />
          </Stack>

          <Typography variant="h6" sx={{ mb: 1 }}>AI-forslag</Typography>
          {suggestions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Ingen forslag (kjør "Analyser" for å generere).</Typography>
          ) : (
            <Table size="small" stickyHeader>
              <TableHead>
                <TableRow>
                  <TableCell>Konsulent</TableCell>
                  <TableCell>Score</TableCell>
                  <TableCell>Begrunnelse</TableCell>
                  <TableCell>Ferdigheter</TableCell>
                  <TableCell>Tidspunkt</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {suggestions.map((s, i) => (
                  <TableRow key={i}>
                    <TableCell>{s.consultantName}</TableCell>
                    <TableCell>{s.matchScore.toFixed(1)}%</TableCell>
                    <TableCell>{s.justification}</TableCell>
                    <TableCell>{(s.skills ?? []).join(', ')}</TableCell>
                    <TableCell>{new Date(s.createdAt).toLocaleString('no-NO')}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </Paper>
      )}
    </Container>
  );
};

function BoxedChips({ title, rows }: { title: string; rows: ProjectRequirementDto[] }) {
  return (
    <Paper sx={{ p: 1, flex: 1 }}>
      <Typography variant="subtitle1" gutterBottom>{title}</Typography>
      {rows && rows.length > 0 ? (
        <Stack spacing={1}>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {rows.map((r, i) => (
              <Chip key={i} label={r.name} size="small" />
            ))}
          </Stack>
          <Box component="ul" sx={{ pl: 3, m: 0 }}>
            {rows.filter(r => r.details).map((r, i) => (
              <li key={i}>
                <Typography variant="body2" color="text.secondary">{r.details}</Typography>
              </li>
            ))}
          </Box>
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">Ingen krav</Typography>
      )}
    </Paper>
  );
}

export default ProjectRequestDetailPage;
