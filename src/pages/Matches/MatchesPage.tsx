import React, { useState } from 'react';
import { Box, Button, Container, Paper, Stack, Tab, Tabs, TextField, Typography, Table, TableHead, TableRow, TableCell, TableBody, Chip } from '@mui/material';
import { findMatches, uploadCvAndMatch, findMatchesBySkills } from '../../services/matchesService';
import type { CandidateMatchResponse } from '../../types/api';

const MatchesPage: React.FC = () => {
  const [tab, setTab] = useState(0);
  const [text, setText] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [results, setResults] = useState<CandidateMatchResponse[] | null>(null);
  const [skillsInput, setSkillsInput] = useState('');

  const onSubmitText = async () => {
    const res = await findMatches({ projectRequestText: text });
    setResults(res);
  };
  const onSubmitUpload = async () => {
    if (!file) return;
    const res = await uploadCvAndMatch(file, text);
    setResults(res);
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Matcher</Typography>
      <Paper sx={{ p: 2, mb: 2 }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)}>
          <Tab label="Prosjektbeskrivelse" />
          <Tab label="Last opp forespørsel (PDF)" />
          <Tab label="Kvalifikasjoner" />
        </Tabs>
        {tab === 0 && (
          <Box sx={{ mt: 2 }}>
            <TextField label="Prosjektbeskrivelse" multiline minRows={4} fullWidth value={text} onChange={(e) => setText(e.target.value)} />
            <Button variant="contained" sx={{ mt: 1 }} onClick={onSubmitText}>Finn matcher</Button>
          </Box>
        )}
        {tab === 1 && (
          <Box sx={{ mt: 2 }}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <Button variant="outlined" component="label">
                Velg PDF
                <input type="file" hidden accept="application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
              </Button>
              <TextField label="Prosjektbeskrivelse" fullWidth value={text} onChange={(e) => setText(e.target.value)} />
            </Stack>
            <Button variant="contained" sx={{ mt: 1 }} onClick={onSubmitUpload} disabled={!file}>Last opp og match</Button>
          </Box>
        )}
        {tab === 2 && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Oppgi kvalifikasjoner/ferdigheter (komma-separert). Vi matcher disse mot konsulenter.
            </Typography>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
              <TextField label="Kvalifikasjoner" fullWidth placeholder="java, azure, react" value={skillsInput} onChange={(e) => setSkillsInput(e.target.value)} />
              <Button variant="contained" onClick={async () => {
                const skills = skillsInput.split(',').map(s => s.trim()).filter(Boolean);
                if (skills.length === 0) return;
                const res = await findMatchesBySkills(skills);
                setResults(res);
              }}>Søk konsulenter</Button>
            </Stack>
            <Box sx={{ mt: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {skillsInput.split(',').map(s => s.trim()).filter(Boolean).map((s, i) => (
                <Chip key={i} label={s} size="small" />
              ))}
            </Box>
          </Box>
        )}
      </Paper>

      {results && results.length > 0 && (
        <Paper sx={{ p: 2 }}>
          <Typography variant="h6" gutterBottom>Resultater</Typography>
          <Table size="small" stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell>Score</TableCell>
                <TableCell>Oppsummering</TableCell>
                <TableCell>Tid (s)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {results.map((r, idx) => (
                <TableRow key={idx}>
                  <TableCell>{r.totalScore}</TableCell>
                  <TableCell>{r.summary}</TableCell>
                  <TableCell>{r.matchTimeSeconds ?? '-'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Paper>
      )}
    </Container>
  );
};

export default MatchesPage;