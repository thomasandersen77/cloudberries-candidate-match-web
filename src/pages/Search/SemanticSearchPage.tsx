import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import { getEmbeddingInfo, searchConsultantsSemantic } from '../../services/consultantsService';
import type { ConsultantWithCvDto, EmbeddingProviderInfo, PageConsultantWithCvDto, SemanticSearchRequest } from '../../types/api';
import { getSkillsDisplay } from '../../utils/skillUtils';

const DELAYED_SPINNER_MS = 500;

import { compareByQualityThenName } from '../../utils/scoreUtils';

const ResultsTable: React.FC<{
  items: ConsultantWithCvDto[];
  onDetails: (userId: string) => void;
  onViewCv: (userId: string) => void;
}> = ({ items, onDetails, onViewCv }) => (
  <TableContainer>
    <Table size="medium">
      <TableHead>
        <TableRow>
          <TableCell>Navn</TableCell>
          <TableCell>Ferdigheter</TableCell>
          <TableCell align="center">CV-kvalitet</TableCell>
          <TableCell align="right">Handlinger</TableCell>
        </TableRow>
      </TableHead>
      <TableBody>
        {items.slice().sort(compareByQualityThenName).map((c) => {
          const activeCv = c.cvs?.find(cv => cv.active);
          const quality = activeCv?.qualityScore ?? null;
          const { displaySkills, remainingCount } = getSkillsDisplay(c, 3);
          return (
            <TableRow key={c.userId} hover>
              <TableCell sx={{ fontWeight: 600 }}>{c.name}</TableCell>
              <TableCell>
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {displaySkills.map((s, idx) => (
                    <Chip key={idx} label={s} size="small" variant="outlined" />
                  ))}
                  {remainingCount > 0 && (
                    <Chip label={`+${remainingCount}`} size="small" variant="outlined" />
                  )}
                </Box>
              </TableCell>
              <TableCell align="center">
                {quality !== null ? (
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{quality}%</Typography>
                ) : (
                  <Typography variant="body2" color="text.secondary">-</Typography>
                )}
              </TableCell>
              <TableCell align="right">
                <Stack direction="row" spacing={1} justifyContent="flex-end">
                  <Button size="small" variant="outlined" onClick={() => onDetails(c.userId)}>Se detaljer</Button>
                  <Button size="small" variant="contained" onClick={() => onViewCv(c.userId)}>Se hele CV</Button>
                </Stack>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  </TableContainer>
);

const sampleQueries: { label: string; text: string }[] = [
  { label: 'Kotlin 5+ år / Spring / Postgres / Offentlig (10)', text: 'Gi meg 10 konsulenter som har minst 5 års erfaring med Kotlin, Spring Boot, Postgres og har jobbet i prosjekter i offentlig sektor' },
  { label: 'SpareBank 1: Java / Spring / Arkitekt', text: 'Hvilke konsulenter bør jeg sende til et prosjekt hos SpareBank 1? De må kunne Java, Spring og må ha hatt arkitekt-roller' },
  { label: 'Fullstack React/Java', text: 'Finn erfarne fullstack-utviklere som har jobbet med React og Java i skyprosjekter de siste tre årene' },
  { label: 'Data engineering', text: 'Foreslå data engineers med erfaring fra Kafka, Spark og dataplattform på GCP/Azure' },
];

const SemanticSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [text, setText] = useState('');
  const [topK, setTopK] = useState<number>(10);
  const [minScore, setMinScore] = useState<number | ''>('');
  const [onlyActive, setOnlyActive] = useState<boolean>(false);
  const [loading, setLoading] = useState(false);
  const [showSpinner, setShowSpinner] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<PageConsultantWithCvDto | null>(null);
  const [embeddingInfo, setEmbeddingInfo] = useState<EmbeddingProviderInfo | null>(null);

  const total = result?.totalElements ?? 0;
  const items = useMemo(() => result?.content ?? [], [result]);

  useEffect(() => {
    (async () => {
      try {
        const info = await getEmbeddingInfo();
        setEmbeddingInfo(info);
      } catch {
        setEmbeddingInfo(null);
      }
    })();
  }, []);

  const submit = async () => {
    setLoading(true);
    setError(null);
    const timer = setTimeout(() => setShowSpinner(true), DELAYED_SPINNER_MS);
    try {
      const body: SemanticSearchRequest = {
        text,
        topK,
        minQualityScore: minScore === '' ? undefined : Number(minScore),
        onlyActiveCv: onlyActive,
        ...(embeddingInfo?.enabled ? { provider: embeddingInfo.provider, model: embeddingInfo.model } : {}),
      } as SemanticSearchRequest;
      const data = await searchConsultantsSemantic({ request: body, page: 0, size: topK });

      setResult(data);
    } catch (e) {
      setError('Semantisk søk feilet. Prøv igjen.');
    } finally {
      clearTimeout(timer);
      setLoading(false);
      setShowSpinner(false);
    }
  };

  const gotoDetails = (userId: string) => navigate(`/consultants/${userId}`);
  const gotoCv = (userId: string) => navigate(`/cv/${userId}`);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Semantisk søk</Typography>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Stack spacing={2}>
          <TextField
            label="Skriv spørsmålet ditt"
            placeholder="f.eks. Finn konsulenter som kan Kotlin og Spring"
            fullWidth
            multiline
            minRows={2}
            value={text}
            onChange={(e) => setText(e.target.value)}
          />
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} alignItems="center">
            <TextField
              label="Top K"
              type="number"
              size="small"
              value={topK}
              onChange={(e) => setTopK(Math.max(1, Math.min(100, Number(e.target.value) || 10)))}
              inputProps={{ min: 1, max: 100 }}
              sx={{ width: 120 }}
            />
            <TextField
              label="Min. kvalitet (%)"
              type="number"
              size="small"
              value={minScore}
              onChange={(e) => setMinScore(e.target.value === '' ? '' : Number(e.target.value))}
              inputProps={{ min: 0, max: 100 }}
              sx={{ width: 180 }}
            />
            <FormControlLabel control={<Switch checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />} label="Kun aktive CV-er" />
            <Box sx={{ flex: 1 }} />
            <Button variant="contained" onClick={submit} disabled={!text.trim() || loading}>
              Søk
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
            {sampleQueries.map(q => (
              <Chip key={q.label} label={q.label} size="small" onClick={() => setText(q.text)} />
            ))}
          </Stack>
        </Stack>
      </Paper>

      {showSpinner && (
        <Box sx={{ p: 2 }}>
          <CircularProgress />
        </Box>
      )}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>
      )}

      <Paper>
        <Box sx={{ p: 2 }}>
          <Typography variant="subtitle1" gutterBottom>Resultater ({total})</Typography>
          <ResultsTable items={items} onDetails={gotoDetails} onViewCv={gotoCv} />
        </Box>
      </Paper>
    </Container>
  );
};

export default SemanticSearchPage;