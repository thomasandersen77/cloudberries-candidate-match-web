import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  Chip,
  CircularProgress,
  Container,
  FormControlLabel,
  Paper,
  Stack,
  Switch,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Grid,
} from '@mui/material';
import { listSkillNames } from '../../services/skillsService';
import {
  searchConsultantsRelational,
  searchConsultantsSemantic,
  getEmbeddingInfo,
} from '../../services/consultantsService';
import type {
  ConsultantWithCvDto,
  PageConsultantWithCvDto,
  EmbeddingProviderInfo,
  RelationalSearchRequest,
  SemanticSearchRequest,
} from '../../types/api';
import { getSkillsDisplay } from '../../utils/skillUtils';

const DELAYED_SPINNER_MS = 500;

function parseRelationalFromSemantic(text: string, knownSkills: string[]): {
  name?: string;
  skillsAll: string[];
} {
  const result: { name?: string; skillsAll: string[] } = { skillsAll: [] };
  if (!text || !text.trim()) return result;

  // Build sets for matching
  const skillSetUpper = new Set(knownSkills.map(s => s.toUpperCase()));
  const stopwords = new Set([
    'SENIOR','JUNIOR','KONSULENT','UTVIKLER','DEVELOPER','FULLSTACK','BACKEND','FRONTEND','ARCHITECT','ARKITEKT',
    'MED','OG','SOM','KAN','OGSÅ','ER','HAR','FOR','TIL','EN','EI','ET','THE','AND','WITH','EXPERIENCE','ERFAREN','MENTOR','LEAD'
  ]);

  // Try multiple language patterns: "heter", "named", "called", "kalles", "heiter", "se llama", "s'appelle"
  const patterns: RegExp[] = [
    /\bheter\s+([A-ZÆØÅ][\p{L}æøåA-Z-]+)(?:\s+([A-ZÆØÅ][\p{L}æøåA-Z-]+))?\b/iu,
    /\bnamed\s+([A-Z][A-Za-z-]+)(?:\s+([A-Z][A-Za-z-]+))?\b/u,
    /\bcalled\s+([A-Z][A-Za-z-]+)(?:\s+([A-Z][A-Za-z-]+))?\b/u,
    /\bkalles\s+([A-ZÆØÅ][\p{L}æøåA-Z-]+)(?:\s+([A-ZÆØÅ][\p{L}æøåA-Z-]+))?\b/iu,
    /\bheiter\s+([A-ZÆØÅ][\p{L}æøåA-Z-]+)(?:\s+([A-ZÆØÅ][\p{L}æøåA-Z-]+))?\b/iu,
    /\bse\s+llama\s+([A-Z][A-Za-z-]+)(?:\s+([A-Z][A-Za-z-]+))?\b/u,
    /\bs['’]appelle\s+([A-Z][A-Za-z-]+)(?:\s+([A-Z][A-Za-z-]+))?\b/u,
  ];
  for (const rx of patterns) {
    const m = text.match(rx);
    if (m && m[1]) {
      const candidate = [m[1], m[2]].filter(Boolean).join(' ').trim();
      if (candidate && !skillSetUpper.has(candidate.toUpperCase())) {
        result.name = candidate;
        break;
      }
    }
  }

  // Tokenize and collect skills
  const tokens = text.split(/[^\p{L}0-9+]+/u).filter(Boolean);
  const foundSkills: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    const up = t.toUpperCase();
    if (skillSetUpper.has(up) && !foundSkills.includes(up)) {
      foundSkills.push(up);
    }
  }

  // If name not found yet, try two-capitalized-tokens heuristic (first + last)
  if (!result.name) {
    for (let i = 0; i < tokens.length - 1; i++) {
      const t1 = tokens[i];
      const t2 = tokens[i + 1];
      const isCap1 = /^[A-ZÆØÅ][a-zæøåA-Z-]+$/.test(t1);
      const isCap2 = /^[A-ZÆØÅ][a-zæøåA-Z-]+$/.test(t2);
      if (isCap1 && isCap2 &&
          !skillSetUpper.has(t1.toUpperCase()) && !stopwords.has(t1.toUpperCase()) &&
          !skillSetUpper.has(t2.toUpperCase()) && !stopwords.has(t2.toUpperCase())) {
        result.name = `${t1} ${t2}`;
        break;
      }
    }
  }

  // If still not found, fall back to single capitalized token
  if (!result.name) {
    for (let i = 0; i < tokens.length; i++) {
      const token = tokens[i];
      if (/^[A-ZÆØÅ][a-zæøåA-Z-]+$/.test(token) &&
          !skillSetUpper.has(token.toUpperCase()) &&
          !stopwords.has(token.toUpperCase())) {
        result.name = token;
        break;
      }
    }
  }

  result.skillsAll = foundSkills;
  return result;
}

import { compareByQualityThenName } from '../../utils/scoreUtils';
import CvScoreBadge from '../../components/CvScoreBadge';

const ResultsTable: React.FC<{
  items: ConsultantWithCvDto[];
  onDetails: (userId: string) => void;
  onViewCv: (userId: string) => void;
}> = ({ items, onDetails, onViewCv }) => {
  return (
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
<CvScoreBadge score={quality} size="md" />
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
};

const ConsultantSearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [tab, setTab] = useState(0);

  // Shared skills options
  const [skillOptions, setSkillOptions] = useState<string[]>([]);
  const [skillsLoading, setSkillsLoading] = useState(false);
  const [skillsError, setSkillsError] = useState<string | null>(null);

  useEffect(() => {
    const loadSkills = async () => {
      setSkillsLoading(true);
      setSkillsError(null);
      try {
        const names = await listSkillNames(undefined, 200);
        setSkillOptions(names);
      } catch (e) {
        setSkillsError('Kunne ikke hente ferdigheter');
      } finally {
        setSkillsLoading(false);
      }
    };
    loadSkills();
  }, []);

  // Relational tab state
  const [rName, setRName] = useState('');
  const [rSkillsAll, setRSkillsAll] = useState<string[]>([]);
  const [rSkillsAny, setRSkillsAny] = useState<string[]>([]);
  const [rMinScore, setRMinScore] = useState<number | ''>('');
  const [rOnlyActive, setROnlyActive] = useState(true);
  const [rPage, setRPage] = useState(0);
  const [rSize, setRSize] = useState(10);
  const [rLoading, setRLoading] = useState(false);
  const [rShowSpinner, setRShowSpinner] = useState(false);
  const [rError, setRError] = useState<string | null>(null);
  const [rNotice, setRNotice] = useState<string | null>(null);
  const [rResult, setRResult] = useState<PageConsultantWithCvDto | null>(null);

  const rTotal = rResult?.totalElements ?? 0;
  const rItems = useMemo(() => rResult?.content ?? [], [rResult]);

  const submitRelational = async () => {
    setRPage(0);
    await runRelationalSearch(0, rSize);
  };

  const runRelationalSearch = async (page: number, size: number) => {
    setRLoading(true);
    setRError(null);
    setRNotice(null);
    const timer = setTimeout(() => setRShowSpinner(true), DELAYED_SPINNER_MS);
    try {
      const body: RelationalSearchRequest = {
        name: rName || undefined,
        skillsAll: rSkillsAll,
        skillsAny: rSkillsAny,
        minQualityScore: rMinScore === '' ? undefined : Number(rMinScore),
        onlyActiveCv: rOnlyActive,
      };
      const data = await searchConsultantsRelational({ request: body, page, size });

      setRResult(data);
    } catch (e) {
      setRError('Søk feilet. Kontroller kriterier og prøv igjen.');
    } finally {
      clearTimeout(timer);
      setRLoading(false);
      setRShowSpinner(false);
    }
  };

  // Semantic tab state
  const [sText, setSText] = useState('');
  const [sTopK, setSTopK] = useState<number>(10);
  const [sMinScore, setSMinScore] = useState<number | ''>('');
  const [sOnlyActive, setSOnlyActive] = useState(false);
  const [sPage, setSPage] = useState(0);
  const [sSize, setSSize] = useState(10);
  const [sLoading, setSLoading] = useState(false);
  const [sShowSpinner, setSShowSpinner] = useState(false);
  const [sError, setSError] = useState<string | null>(null);
  const [sResult, setSResult] = useState<PageConsultantWithCvDto | null>(null);
  const [embeddingInfo, setEmbeddingInfo] = useState<EmbeddingProviderInfo | null>(null);

  const sTotal = sResult?.totalElements ?? 0;
  const sItems = useMemo(() => sResult?.content ?? [], [sResult]);

  useEffect(() => {
    const loadEmbeddingInfo = async () => {
      try {
        const info = await getEmbeddingInfo();
        setEmbeddingInfo(info);
      } catch (e) {
        // Hvis vi ikke klarer å hente info, tillat søk uansett (backend bruker default-konfig).
        setEmbeddingInfo(null);
      }
    };
    loadEmbeddingInfo();
  }, []);

  const submitSemantic = async () => {
    setSPage(0);
    await runSemanticSearch(0, sSize);
  };

  const runSemanticSearch = async (page: number, size: number) => {
    setSLoading(true);
    setSError(null);
    const timer = setTimeout(() => setSShowSpinner(true), DELAYED_SPINNER_MS);
    try {
      const body: SemanticSearchRequest = {
        text: sText,
        topK: sTopK,
        minQualityScore: sMinScore === '' ? undefined : Number(sMinScore),
        onlyActiveCv: sOnlyActive,
        // Oppgi provider/modell kun om server uttrykkelig sier at embedding er aktivert
        ...(embeddingInfo?.enabled
          ? { provider: embeddingInfo.provider, model: embeddingInfo.model }
          : {}),
      } as SemanticSearchRequest;
      const data = await searchConsultantsSemantic({ request: body, page, size });

      setSResult(data);
    } catch (e) {
      setSError('Semantisk søk feilet. Prøv igjen.');
    } finally {
      clearTimeout(timer);
      setSLoading(false);
      setSShowSpinner(false);
    }
  };

  const handleSemanticFallback = async () => {
    // Parse semantic text into a relational query and execute it on the relational tab
    const guessed = parseRelationalFromSemantic(sText, skillOptions);
    // Apply guessed fields to relational form
    if (guessed.name) setRName(guessed.name);
    setRSkillsAll(guessed.skillsAll);
    setRSkillsAny([]);
    setROnlyActive(sOnlyActive);
    setRMinScore(sMinScore);
    setTab(0);
    setRNotice('Viser relasjonelt søk basert på teksten fra semantisk søk.');
    await runRelationalSearch(0, rSize);
  };

  const gotoDetails = (userId: string) => navigate(`/consultants/${userId}`);
  const gotoCv = (userId: string) => navigate(`/cv/${userId}`);

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>
        Konsulentsøk
      </Typography>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} aria-label="search-tabs" variant="scrollable" scrollButtons="auto">
          <Tab label="Relasjonelt søk" />
          <Tab label="Semantisk søk" />
        </Tabs>
      </Paper>

      {tab === 0 && (
        <Box>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    label="Navn"
                    value={rName}
                    onChange={(e) => setRName(e.target.value)}
                    size="small"
                    fullWidth
                    placeholder="f.eks. Thomas"
                    helperText="Delvis match på konsulentens navn (ikke eksakt, ikke case-sensitiv)"
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Autocomplete
                    multiple
                    size="small"
                    options={skillOptions}
                    loading={skillsLoading}
                    value={rSkillsAll}
                    onChange={(_, val) => setRSkillsAll(val)}
                    renderInput={(params) => <TextField {...params} label="MÅ-krav (minimumskrav)" placeholder="Velg..." />}
                  />
                </Grid>
                <Grid item xs={12} md={4}>
                  <Autocomplete
                    multiple
                    size="small"
                    options={skillOptions}
                    loading={skillsLoading}
                    value={rSkillsAny}
                    onChange={(_, val) => setRSkillsAny(val)}
                    renderInput={(params) => <TextField {...params} label="BØR-krav" placeholder="Velg..." />}
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <TextField
                    label="Min. kvalitet (%)"
                    type="number"
                    size="small"
                    inputProps={{ min: 0, max: 100 }}
                    value={rMinScore}
                    onChange={(e) => setRMinScore(e.target.value === '' ? '' : Number(e.target.value))}
                    fullWidth
                  />
                </Grid>
                <Grid item xs={12} sm={6} md={3}>
                  <FormControlLabel
                    control={<Switch checked={rOnlyActive} onChange={(e) => setROnlyActive(e.target.checked)} />}
                    label="Kun aktive CV-er"
                  />
                </Grid>
                <Grid item xs={12} md={3}>
                  <Button variant="contained" onClick={submitRelational} disabled={rLoading} fullWidth>
                    Søk
                  </Button>
                </Grid>
              </Grid>
            </Stack>
            {skillsError && <Alert severity="warning" sx={{ mt: 2 }}>{skillsError}</Alert>}
          </Paper>

          <Paper>
            {rNotice && <Box sx={{ p: 2 }}><Alert severity="info">{rNotice}</Alert></Box>}
            {(rLoading && rShowSpinner) ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Laster resultater...
                </Typography>
              </Box>
            ) : rError ? (
              <Box sx={{ p: 2 }}><Alert severity="error">{rError}</Alert></Box>
            ) : rItems.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary">Ingen resultater</Typography>
              </Box>
            ) : (
              <>
                <ResultsTable items={rItems} onDetails={gotoDetails} onViewCv={gotoCv} />
                <TablePagination
                  component="div"
                  rowsPerPageOptions={[5, 10, 20, 50]}
                  count={rTotal}
                  rowsPerPage={rSize}
                  page={rPage}
                  onPageChange={(_, p) => { setRPage(p); runRelationalSearch(p, rSize); }}
                  onRowsPerPageChange={(e) => { const s = parseInt(e.target.value, 10); setRSize(s); setRPage(0); runRelationalSearch(0, s); }}
                />
              </>
            )}
          </Paper>
        </Box>
      )}

      {tab === 1 && (
        <Box>
          <Paper sx={{ p: 2, mb: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>Om semantisk rangering</Typography>
            <Typography variant="body2" color="text.secondary">
              Resultatene under er rangert semantisk basert på tekstbeskrivelsen. Et eksplisitt likhetsskår vil kunne
              vises i fremtiden når API-et eksponerer dette.
            </Typography>
            {embeddingInfo && (
              <Alert severity={embeddingInfo.enabled ? 'info' : 'warning'} sx={{ mt: 2 }}>
                {embeddingInfo.enabled ? (
                  <>Provider: <b>{embeddingInfo.provider}</b>, Modell: <b>{embeddingInfo.model}</b>, Dimensjon: <b>{embeddingInfo.dimension}</b></>
                ) : (
                  <>Semantisk søk er ikke tilgjengelig for øyeblikket.</>
                )}
              </Alert>
            )}
            <Alert severity="info" sx={{ mt: 2 }}>
              Får du 0 treff? Prøv å øke <b>Top K</b>, slå av <b>Kun aktive CV-er</b>, eller fjern <b>Min. kvalitet</b>.
            </Alert>
          </Paper>

          <Paper sx={{ p: 2, mb: 2 }}>
            <Stack direction={{ xs: 'column', md: 'row' }} spacing={2}>
              <TextField
                label="Beskrivelse (naturlig språk)"
                value={sText}
                onChange={(e) => setSText(e.target.value)}
                size="small"
                fullWidth
                multiline
                minRows={2}
                placeholder="f.eks. Konsulent som heter Thomas og kan Kotlin, Java og AWS"
              />
              <TextField
                label="Top K"
                type="number"
                size="small"
                inputProps={{ min: 1, max: 100 }}
                value={sTopK}
                onChange={(e) => setSTopK(Number(e.target.value))}
                sx={{ width: 140 }}
              />
              <TextField
                label="Min. kvalitet (%)"
                type="number"
                size="small"
                inputProps={{ min: 0, max: 100 }}
                value={sMinScore}
                onChange={(e) => setSMinScore(e.target.value === '' ? '' : Number(e.target.value))}
                sx={{ width: 160 }}
              />
              <FormControlLabel
                control={<Switch checked={sOnlyActive} onChange={(e) => setSOnlyActive(e.target.checked)} />}
                label="Kun aktive CV-er"
              />
              <Button
                variant="contained"
                onClick={submitSemantic}
                disabled={sLoading || (embeddingInfo ? !embeddingInfo.enabled : false) || !sText.trim()}
              >
                Søk
              </Button>
            </Stack>
          </Paper>

          <Paper>
            {(sLoading && sShowSpinner) ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <CircularProgress />
                <Typography variant="body2" sx={{ mt: 1 }}>
                  Laster resultater...
                </Typography>
              </Box>
            ) : sError ? (
              <Box sx={{ p: 2 }}><Alert severity="error">{sError}</Alert></Box>
            ) : sItems.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>Ingen resultater</Typography>
                <Button variant="outlined" onClick={handleSemanticFallback} disabled={sLoading}>
                  Prøv relasjonelt søk ut fra teksten
                </Button>
              </Box>
            ) : (
              <>
                <ResultsTable items={sItems} onDetails={gotoDetails} onViewCv={gotoCv} />
                <TablePagination
                  component="div"
                  rowsPerPageOptions={[5, 10, 20, 50]}
                  count={sTotal}
                  rowsPerPage={sSize}
                  page={sPage}
                  onPageChange={(_, p) => { setSPage(p); runSemanticSearch(p, sSize); }}
                  onRowsPerPageChange={(e) => { const s = parseInt(e.target.value, 10); setSSize(s); setSPage(0); runSemanticSearch(0, s); }}
                />
              </>
            )}
          </Paper>
        </Box>
      )}
    </Container>
  );
};

export default ConsultantSearchPage;