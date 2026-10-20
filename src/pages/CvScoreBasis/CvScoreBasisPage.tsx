import React, { useEffect, useMemo, useState } from 'react';
import { Link as RouterLink, useSearchParams } from 'react-router-dom';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Collapse,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Typography,
} from '@mui/material';
import { ExpandLess, ExpandMore } from '@mui/icons-material';
import ArrowBackIcon from '@mui/icons-material/ArrowBackIosNew';
import PageIntro from '../../components/PageIntro';
import { getCvScoreBasis, listCvScoreBases } from '../../services/adminService';
import type { CvMetrics, CvScoreBasis, CvScoreBasisRow } from '../../types/api';
import { reviewRulesLabel, formatScoredAt } from '../CvScore/cvScoreDetailText';
import { criterionLabel, formatPeriod, sortScoreBases, summaryLines, totalPointsLost, type ScoreBasisSort, type ScoreBasisSortOrder } from './cvScoreBasisText';

const yes = (flag: boolean) => (flag ? '✓' : '–');

/** Keep the historical basis visible when rules, the CV, or the counting date have changed. */
function metricViews(basis: CvScoreBasis): { metrics: CvMetrics; source: string }[] {
  const { metrics: stored, currentMetrics: current } = basis;
  const describe = (m: CvMetrics) => `Telleregler v${m.version}${m.countedOn ? `, talt ${m.countedOn}` : ', telledato ukjent'}.`;
  if (!stored) return current ? [{ metrics: current, source: `Fra CV-en slik den er nå; tellingene ble ikke lagret med denne scoren. ${describe(current)}` }] : [];
  const views = [{ metrics: stored, source: `Lagrede tellinger fra CV-en som ble vurdert. ${describe(stored)}` }];
  if (current && (stored.version !== current.version || basis.stale || stored.countedOn !== current.countedOn)) {
    const changed = basis.stale || (stored.cvHash && current.cvHash && stored.cvHash !== current.cvHash);
    views.push({ metrics: current, source: `${changed ? 'Fra dagens CV, som kan ha annet innhold enn den vurderte CV-en.' : 'Samme CV-innhold, talt på nytt.'} ${describe(current)} Dette endrer ikke den lagrede scoren.` });
  }
  return views;
}

/**
 * What a CV score rests on, for whoever maintains the review prompt.
 *
 * The CV-score page shows the total and what the model told the consultant. This shows what the
 * total was made of: the model's score and reason per criterion with the points each took off,
 * the model's own notes on where the rubric was hard to apply, and counts of the CV made in code.
 * Read only; nothing here calls the model.
 */
const CvScoreBasisPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const selectedId = searchParams.get('id');
  const [rows, setRows] = useState<CvScoreBasisRow[] | null>(null);
  const [filter, setFilter] = useState('');
  const [rulesFilter, setRulesFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState<ScoreBasisSort>('score');
  const [sortOrder, setSortOrder] = useState<ScoreBasisSortOrder>('desc');
  const [result, setResult] = useState<{ id: string; basis: CvScoreBasis | null; error: string | null } | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const selectedResult = result?.id === selectedId ? result : null;
  const basis = selectedResult?.basis ?? null;
  const loadingBasis = Boolean(selectedId && !selectedResult);


  useEffect(() => {
    listCvScoreBases()
      .then(setRows)
      .catch(() => setListError('Kunne ikke hente listen over CV-scorer.'));
  }, []);

  useEffect(() => {
    setResult(null);
    if (!selectedId) return;
    let active = true;
    getCvScoreBasis(selectedId)
      .then(data => { if (active) setResult({ id: selectedId, basis: data, error: null }); })
      .catch(() => {
        if (active) setResult({ id: selectedId, basis: null, error: 'Kunne ikke hente grunnlaget for denne scoren.' });
      });
    return () => { active = false; };
  }, [selectedId]);

  const visibleRows = useMemo(
    () => sortScoreBases((rows ?? []).filter(row =>
      row.name.toLowerCase().includes(filter.trim().toLowerCase()) &&
      (rulesFilter === 'ALL' || row.rulesStatus === rulesFilter)), sortBy, sortOrder),
    [rows, filter, rulesFilter, sortBy, sortOrder]
  );

  const changeSort = (column: ScoreBasisSort) => {
    setSortOrder(column === sortBy && sortOrder === 'desc' ? 'asc' : 'desc');
    setSortBy(column);
  };

  const toggleCandidate = (id: string) => setSearchParams(previous => {
    const next = new URLSearchParams(previous);
    if (next.get('id') === id) next.delete('id');
    else next.set('id', id);
    return next;
  });

  return (
    <Box sx={{ py: { xs: 2, md: 4 } }}>
      <Button
        component={RouterLink}
        to="/superbruker"
        size="small"
        startIcon={<ArrowBackIcon sx={{ fontSize: 14 }} />}
        sx={{ textTransform: 'none', mb: 2 }}
      >
        Tilbake til superbruker
      </Button>
      <Typography variant="h4" component="h1" sx={{ fontWeight: 700, letterSpacing: '-0.03em', mb: 1 }}>
        CV-scoregrunnlag
      </Typography>
      <PageIntro page="cvScoreBasis" />

      {listError && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setListError(null)}>{listError}</Alert>}

      <Paper elevation={0} sx={{ p: { xs: 1, sm: 2 } }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2 }}>
          <TextField size="small" fullWidth label="Filtrer på navn" value={filter}
            onChange={event => setFilter(event.target.value)} />
          <TextField select size="small" fullWidth label="Vurderingsregler" value={rulesFilter}
            onChange={event => setRulesFilter(event.target.value)}>
            <MenuItem value="ALL">Alle vurderinger</MenuItem>
            <MenuItem value="OUTDATED">Eldre vurderingsregler</MenuItem>
            <MenuItem value="EQUIVALENT">Eldre prompt, samme regler</MenuItem>
            <MenuItem value="UNKNOWN">Ukjente vurderingsregler</MenuItem>
          </TextField>
        </Stack>
        {rows === null ? <CircularProgress size={24} /> : (
          <Table size="small" aria-label="Vurderte konsulenter" sx={{ tableLayout: 'fixed', '& > thead > tr > th, & > tbody > tr > td': { px: { xs: 1, sm: 2 } } }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: { xs: '50%', sm: '60%' } }}>Konsulent</TableCell>
                <TableCell align="right" sortDirection={sortBy === 'score' ? sortOrder : false} sx={{ width: { xs: '25%', sm: '15%' } }}>
                  <TableSortLabel active={sortBy === 'score'} direction={sortBy === 'score' ? sortOrder : 'desc'}
                    aria-label="Sorter etter score" onClick={() => changeSort('score')} sx={{ minHeight: 44 }}>
                    Score
                  </TableSortLabel>
                </TableCell>
                <TableCell sortDirection={sortBy === 'date' ? sortOrder : false} sx={{ width: '25%' }}>
                  <TableSortLabel active={sortBy === 'date'} direction={sortBy === 'date' ? sortOrder : 'desc'}
                    aria-label="Sorter etter dato" onClick={() => changeSort('date')} sx={{ minHeight: 44 }}>
                    Dato
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {visibleRows.map(row => {
                const expanded = row.candidateId === selectedId;
                const buttonId = `basis-toggle-${row.candidateId}`;
                const regionId = `basis-${row.candidateId}`;
                return (
                  <React.Fragment key={row.candidateId}>
                    <TableRow hover selected={expanded} onClick={() => toggleCandidate(row.candidateId)} sx={{ cursor: 'pointer' }}>
                      <TableCell>
                        <Button id={buttonId} aria-expanded={expanded} aria-controls={regionId}
                          endIcon={expanded ? <ExpandLess /> : <ExpandMore />}
                          sx={{ width: '100%', minWidth: 0, minHeight: 44, p: 0, textTransform: 'none', justifyContent: 'space-between', color: 'text.primary' }}>
                          <Typography component="span" variant="body2" sx={{ fontWeight: 600, textAlign: 'left', overflowWrap: 'anywhere' }}>{row.name}</Typography>
                        </Button>
                        <Stack direction="row" flexWrap="wrap" useFlexGap spacing={0.5}
                          sx={{ mt: 0.25, '& .MuiChip-root': { maxWidth: '100%', height: 'auto', minHeight: 24 }, '& .MuiChip-label': { whiteSpace: 'normal', py: 0.25 } }}>
                          {row.stale && <Chip size="small" label="Utdatert" />}
                          {reviewRulesLabel(row.rulesStatus) && <Chip size="small" variant="outlined" label={reviewRulesLabel(row.rulesStatus)} />}
                          {!row.hasBreakdown && <Chip size="small" variant="outlined" label="Uten kriterier" />}
                        </Stack>
                      </TableCell>
                      <TableCell align="right">{row.scorePercent}</TableCell>
                      <TableCell>
                        <Typography variant="caption" color="text.secondary" sx={{ overflowWrap: 'anywhere' }}>
                          {row.scoredAt ? new Date(row.scoredAt).toLocaleDateString('nb-NO') : 'ukjent'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                    {expanded && (
                      <TableRow>
                        <TableCell colSpan={3} sx={{ py: 0 }}>
                          <Collapse in={expanded} unmountOnExit>
                            <Box id={regionId} role="region" aria-labelledby={buttonId} sx={{ py: 2, minWidth: 0 }}>
                              {loadingBasis && <CircularProgress size={24} aria-label="Laster vurderingsgrunnlag" />}
                              {selectedResult?.error && <Alert severity="error">{selectedResult.error}</Alert>}
                              {basis && <BasisView basis={basis} />}
                            </Box>
                          </Collapse>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                );
              })}
              {visibleRows.length === 0 && <TableRow><TableCell colSpan={3}>Ingen konsulenter passer filtrene.</TableCell></TableRow>}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
};

const BasisView: React.FC<{ basis: CvScoreBasis }> = ({ basis }) => {
  const scored = formatScoredAt(basis);
  const counts = metricViews(basis);
  return (
    <Stack spacing={2.5}>
      <Paper elevation={0} sx={{ p: 2.5 }}>
        <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={1}>
          <Box>
            <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>{basis.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              {scored ? `Scoret ${scored}` : 'Tidspunkt for scoring er ikke registrert'}
              {basis.promptVersion ? ` · prompt ${basis.promptVersion}` : ''}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Gjeldende prompt: {basis.currentPromptVersion ?? 'ukjent'}
            </Typography>
            {reviewRulesLabel(basis.rulesStatus) && <Typography variant="body2" color="warning.main">{reviewRulesLabel(basis.rulesStatus)}</Typography>}
            {basis.stale && (
              <Typography variant="body2" color="warning.main" sx={{ mt: 0.5 }}>
                CV-en er endret etter vurderingen, eller det er ukjent hvilken versjon som ble vurdert.
              </Typography>
            )}
          </Box>
          <Box sx={{ textAlign: { sm: 'right' } }}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>{basis.scorePercent}%</Typography>
            <Stack direction="row" spacing={1} justifyContent={{ sm: 'flex-end' }}>
              <Button size="small" component={RouterLink} to={`/cv-score/${basis.candidateId}`}>CV-score</Button>
              <Button size="small" component={RouterLink} to={`/cv/${basis.candidateId}`}>CV</Button>
            </Stack>
          </Box>
        </Stack>
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5 }}>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>Kriterier og trekk</Typography>
        {basis.criteria.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Scoren ble lagret før kriteriene ble tatt vare på. Kjør vurderingen på nytt for å se dem.
          </Typography>
        ) : (
          <Box sx={{ overflowX: 'auto' }}>
          <Table size="small" aria-label="Kriterier og trekk" sx={{ minWidth: 720 }}>
            <TableHead>
              <TableRow>
                <TableCell>Kriterium</TableCell>
                <TableCell align="right">Vekt</TableCell>
                <TableCell align="right">Skår</TableCell>
                <TableCell align="right">Trekk</TableCell>
                <TableCell>Modellens begrunnelse</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {basis.criteria.map(c => (
                <TableRow key={c.criterion}>
                  <TableCell sx={{ whiteSpace: 'nowrap', verticalAlign: 'top' }}>{criterionLabel(c.criterion)}</TableCell>
                  <TableCell align="right" sx={{ verticalAlign: 'top' }}>{c.weight}</TableCell>
                  <TableCell align="right" sx={{ verticalAlign: 'top' }}>{c.score}</TableCell>
                  <TableCell align="right" sx={{ verticalAlign: 'top', fontWeight: 600 }}>−{c.pointsLost.toFixed(1)}</TableCell>
                  <TableCell sx={{ verticalAlign: 'top' }}>{c.justification}</TableCell>
                </TableRow>
              ))}
              <TableRow>
                <TableCell colSpan={3} sx={{ fontWeight: 600 }}>Sum trekk fra 100</TableCell>
                <TableCell align="right" sx={{ fontWeight: 600 }}>−{totalPointsLost(basis.criteria).toFixed(1)}</TableCell>
                <TableCell />
              </TableRow>
            </TableBody>
          </Table>
          </Box>
        )}
      </Paper>

      <Paper elevation={0} sx={{ p: 2.5 }}>
        <Typography variant="h6" component="h3" sx={{ fontWeight: 600, mb: 1 }}>Modellens merknader til prompten</Typography>
        {basis.calibrationNotes.length === 0 ? (
          <Typography variant="body2" color="text.secondary">
            Ingen merknader. Modellen skriver dem fra promptversjon v5.
          </Typography>
        ) : (
          <Box component="ul" sx={{ m: 0, pl: 2.5 }}>
            {basis.calibrationNotes.map((note, i) => (
              <Typography component="li" variant="body2" key={i} sx={{ mb: 0.5 }}>{note}</Typography>
            ))}
          </Box>
        )}
      </Paper>

      {counts.map((counted, index) => <MetricsView key={index} metrics={counted.metrics} source={counted.source} />)}
    </Stack>
  );
};

const MetricsView: React.FC<{ metrics: CvMetrics; source: string }> = ({ metrics, source }) => (
  <Paper elevation={0} sx={{ p: 2.5 }}>
    <Typography variant="h6" component="h3" sx={{ fontWeight: 600 }}>Tellinger fra CV-en</Typography>
    <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
      {source} Regnet ut i kode, uten modell, og teller ikke med i scoren. Metodikk, team, førsteperson og
      målbar verdi er tekstmønstre som peker på et prosjekt, ikke bevis.
    </Typography>
    <Stack direction="row" flexWrap="wrap" useFlexGap spacing={1} sx={{ mb: 2 }}>
      <Chip size="small" label={`Profil: ${metrics.profileWords} ord`} />
      <Chip size="small" label={`Nøkkelkvalifikasjoner: ${metrics.keyPoints}`} />
      {summaryLines(metrics.recent).map(line => (
        <Chip
          key={line.label}
          size="small"
          color={line.gap && line.value > 0 ? 'warning' : 'default'}
          variant={line.gap && line.value > 0 ? 'filled' : 'outlined'}
          label={`${line.label}: ${line.value}`}
        />
      ))}
    </Stack>
    <Box sx={{ overflowX: 'auto' }}>
      <Table size="small" aria-label="Tellinger per prosjekt">
        <TableHead>
          <TableRow>
            <TableCell>Kunde</TableCell>
            <TableCell>Periode</TableCell>
            <TableCell align="right">Ord</TableCell>
            <TableCell align="right">Roller med tekst</TableCell>
            <TableCell align="right">Ferdigheter</TableCell>
            <TableCell align="center">Metodikk</TableCell>
            <TableCell align="center">Team</TableCell>
            <TableCell align="center">Målbar verdi</TableCell>
            <TableCell align="center">Førsteperson</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {metrics.projects.map((p, i) => (
            <TableRow key={`${p.customer}-${i}`} sx={{ opacity: p.recent ? 1 : 0.55 }}>
              <TableCell>{p.customer}</TableCell>
              <TableCell sx={{ whiteSpace: 'nowrap' }}>{formatPeriod(p)}</TableCell>
              <TableCell align="right" sx={{ color: p.descriptionWords === 0 ? 'warning.main' : undefined, fontWeight: p.descriptionWords === 0 ? 600 : undefined }}>
                {p.descriptionWords}
              </TableCell>
              <TableCell align="right">{p.rolesWithText}/{p.roles}</TableCell>
              <TableCell align="right">{p.skills}</TableCell>
              <TableCell align="center">{yes(p.mentionsMethod)}</TableCell>
              <TableCell align="center">{yes(p.mentionsTeam)}</TableCell>
              <TableCell align="center">{yes(p.measurableValue)}</TableCell>
              <TableCell align="center">{yes(p.firstPerson)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
    <Typography variant="caption" color="text.secondary">
      Nedtonede prosjekter sluttet for mer enn ti år siden; standarden lar dem være kortere, og de er ikke med i tallene over.
    </Typography>
  </Paper>
);

export default CvScoreBasisPage;
