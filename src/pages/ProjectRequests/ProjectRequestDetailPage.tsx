import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Container, Paper, Stack, Typography, Table, TableHead, TableRow, TableCell, TableBody, LinearProgress, Button, Box, Chip } from '@mui/material';
import type { ProjectRequestResponseDto, ProjectRequirementDto } from '../../types/api';
import { getProjectRequestById, analyzeProjectRequest, getProjectRequestSuggestions, closeProjectRequest } from '../../services/projectRequestsService';
import HighQualityToggle from '../../components/HighQualityToggle';

const ProjectRequestDetailPage: React.FC = () => {
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [dto, setDto] = useState<ProjectRequestResponseDto | null>(null);
  const [suggestions, setSuggestions] = useState<Array<{ consultantName: string; userId: string; cvId: string; matchScore: number; justification: string; createdAt: string; skills?: string[] }>>([]);
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
        setError('Kunne ikke hente kundeforespørselen. Backend svarte med feil.');
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Kundeforspørsel</Typography>
      {loading && <LinearProgress sx={{ mb: 2 }} />}
      {error && <Typography color="error.main" sx={{ mb: 2 }}>{error}</Typography>}
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
            <Button size="small" color="error" variant="outlined" disabled={actionsLoading || !dto.id} onClick={async () => {
              if (!dto?.id) return;
              setActionsLoading(true);
              try {
                await closeProjectRequest(dto.id);
                setError(null);
              } catch {
                setError('Kunne ikke lukke forespørselen.');
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
            <RequirementList title="Må-krav" rows={dto.mustRequirements ?? []} />
            <RequirementList title="Bør-krav" rows={dto.shouldRequirements ?? []} />
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

/**
 * The requirements, in full.
 *
 * They used to be chips. A chip is a short token and does not wrap, so a requirement reading "Det
 * stilles krav til bakgrunnssjekk av kandidaten: verifisering av høyeste utdannelse, siste 10 års
 * erfaring og ID-kontroll" made its column as wide as the sentence. With flex: 1 and no minWidth,
 * a flex item may not shrink below its content, so the Må-krav column grew past its half of the
 * row and pushed Bør-krav off the right edge of the window: on request 8 it started 88 pixels
 * outside it, and six requirements looked like none.
 *
 * The details also sat in a separate list underneath, so a requirement and its own elaboration were
 * two items with nothing tying them together. They are one row here.
 *
 * appliesTo is shown for the supplier's requirements only. The consultant's are what a CV can
 * answer and what a score is about; the supplier's are submission deadlines and framework
 * agreements, and a reader counting competence demands should not have to read all of them to find
 * out which is which. Marking only one side keeps the common case quiet.
 */
function RequirementList({ title, rows }: { title: string; rows: ProjectRequirementDto[] }) {
  return (
    <Paper sx={{ p: 1.5, flex: 1, minWidth: 0, alignSelf: 'stretch' }}>
      <Typography variant="subtitle1" gutterBottom>
        {title}{rows.length > 0 && ` (${rows.length})`}
      </Typography>
      {rows.length > 0 ? (
        <Stack component="ul" spacing={1.25} sx={{ listStyle: 'none', pl: 0, m: 0 }}>
          {rows.map((r, i) => (
            <Box component="li" key={i}>
              <Typography
                variant="body2"
                // anywhere rather than break-word: a reference like "20250001)" is one long token
                // and would otherwise widen the column on its own.
                sx={{ overflowWrap: 'anywhere' }}
              >
                {r.name}
                {r.appliesTo === 'SUPPLIER' && (
                  <Chip
                    label="Leverandør"
                    size="small"
                    variant="outlined"
                    sx={{ ml: 0.75, height: 18, fontSize: '0.65rem' }}
                  />
                )}
              </Typography>
              {r.details && (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{ mt: 0.25, overflowWrap: 'anywhere' }}
                >
                  {r.details}
                </Typography>
              )}
            </Box>
          ))}
        </Stack>
      ) : (
        <Typography variant="body2" color="text.secondary">Ingen krav</Typography>
      )}
    </Paper>
  );
}

export default ProjectRequestDetailPage;
