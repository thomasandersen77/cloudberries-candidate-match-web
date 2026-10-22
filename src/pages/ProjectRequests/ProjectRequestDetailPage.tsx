import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Paper, Stack, Typography, LinearProgress, Button, Box } from '@mui/material';
import type { AISuggestionDto, ProjectRequestResponseDto } from '../../types/api';
import RequirementList from '../../components/matches/RequirementList';
import AiSuggestions from '../../components/matches/AiSuggestions';
import { getProjectRequestById, analyzeProjectRequest, getProjectRequestSuggestions, closeProjectRequest } from '../../services/projectRequestsService';
import HighQualityToggle from '../../components/HighQualityToggle';
import AnalysisFailedAlert from '../../components/projectRequests/AnalysisFailedAlert';

const ProjectRequestDetailPage: React.FC = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [dto, setDto] = useState<ProjectRequestResponseDto | null>(null);
  const [suggestions, setSuggestions] = useState<AISuggestionDto[]>([]);
  const [actionsLoading, setActionsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Default off every time; not persisted.
  const [highQuality, setHighQuality] = useState(false);

  useEffect(() => {
    (async () => {
      if (!id) return;
      setLoading(true);
      setError(null);
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
      } catch {
        setError('Kunne ikke hente avropet. Backend svarte med feil.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const status = (dto as unknown as { status?: string } | null)?.status;

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Avrop</Typography>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Typography color="error.main" sx={{ mb: 2 }}>{error}</Typography>}
      {dto?.id != null && dto.analysisStatus === 'FAILED' && (
        <Box sx={{ mb: 2 }}>
          <AnalysisFailedAlert requestId={dto.id} error={dto.analysisError}
            onAnalysed={() => { void getProjectRequestById(dto.id as number).then(setDto); }} />
        </Box>
      )}
      {dto && (
        <Paper sx={{ p: 2 }}>
          <Stack direction="row" spacing={2} sx={{ mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="body2"><strong>ID:</strong> {dto.id ?? '-'}</Typography>
            <Typography variant="body2"><strong>Kunde:</strong> {dto.customerName ?? '-'}</Typography>
            <Typography variant="body2"><strong>Tittel:</strong> {dto.title ?? '-'}</Typography>
            <Typography variant="body2"><strong>Filnavn:</strong> {dto.originalFilename ?? '-'}</Typography>
            <Typography variant="body2"><strong>Status:</strong> {status ?? '-'}</Typography>
            <Typography variant="body2"><strong>Opplastet:</strong> {dto.uploadedAt ? new Date(dto.uploadedAt).toLocaleString('nb-NO') : '-'}</Typography>
            <Typography variant="body2"><strong>Svarfrist:</strong> {dto.deadlineDate ? new Date(dto.deadlineDate).toLocaleDateString('nb-NO') : '-'}</Typography>
            <Box sx={{ flex: 1 }} />
            <HighQualityToggle checked={highQuality} onChange={setHighQuality} disabled={actionsLoading} />
            <Button size="small" variant="outlined" disabled={actionsLoading || !dto.id} onClick={async () => {
              if (!dto?.id) return;
              setActionsLoading(true);
              try {
                await analyzeProjectRequest(dto.id, { useHighestQualityModel: highQuality });
                const sugg = await getProjectRequestSuggestions(dto.id);
                setSuggestions(sugg ?? []);
                setError(null);
              } catch {
                setError('Analysering feilet. Prøv igjen senere.');
              } finally {
                setActionsLoading(false);
              }
            }}>Analyser (AI)</Button>
            <Button size="small" color="error" variant="outlined" disabled={actionsLoading || !dto.id || status === 'CLOSED'} onClick={async () => {
              if (!dto?.id) return;
              setActionsLoading(true);
              try {
                // The answer is the request as the server now has it. It was dropped, so the page
                // kept saying OPEN and offered to close it again.
                const closed = await closeProjectRequest(dto.id);
                setDto(closed as ProjectRequestResponseDto);
                setError(null);
              } catch {
                setError('Kunne ikke lukke avropet.');
              } finally {
                setActionsLoading(false);
              }
            }}>Lukk avropet</Button>
          </Stack>
          {dto.summary && (
            <>
              <Typography variant="subtitle1">Oppsummering</Typography>
              <Typography variant="body2" sx={{ whiteSpace: 'pre-line', mb: 2 }}>{dto.summary}</Typography>
            </>
          )}

          {/*
            alignItems flex-start so a short list does not stretch to the height of a long one,
            and see RequirementList for why each column can shrink at all.
          */}
          <Stack
            direction={{ xs: 'column', md: 'row' }}
            spacing={2}
            alignItems="flex-start"
            sx={{ mb: 2 }}
          >
            <RequirementList title="Må-krav" tone="warning" rows={dto.mustRequirements ?? []} />
            <RequirementList title="Bør-krav" tone="info" rows={dto.shouldRequirements ?? []} />
          </Stack>

          <Typography variant="h6" sx={{ mb: 1 }}>AI-forslag</Typography>
          {suggestions.length === 0 ? (
            <Typography variant="body2" color="text.secondary">Ingen forslag (kjør "Analyser" for å generere).</Typography>
          ) : (
            <AiSuggestions suggestions={suggestions} />
          )}
        </Paper>
      )}
    </Container>
  );
};

export default ProjectRequestDetailPage;
