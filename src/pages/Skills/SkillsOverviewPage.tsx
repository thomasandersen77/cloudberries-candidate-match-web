import React, { useEffect, useState } from 'react';
import { Autocomplete, Box, Chip, Container, Paper, Stack, TextField, Typography, Button } from '@mui/material';
import StarIcon from '@mui/icons-material/Star';
import { listSkills } from '../../services/skillsService';
import type { SkillInCompanyDto } from '../../types/api';
import { useNavigate } from 'react-router-dom';

const SkillsOverviewPage: React.FC = () => {
  const [skills, setSkills] = useState<SkillInCompanyDto[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [selectedFilters, setSelectedFilters] = useState<string[]>([]);
  const [bestBySkill, setBestBySkill] = useState<Record<string, Set<string>>>({});
  const scoresCache = React.useRef<Map<string, number>>(new Map());
  const navigate = useNavigate();

  const fetchSkills = async (filters?: string[]) => {
    setLoading(true);
    try {
      const res = await listSkills(filters);
      setSkills(res);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSkills(); }, []);

  const skillNames = Array.from(new Set(skills.map((s) => s.name))).sort();
  const filteredSkills = skills.filter((s) => s.name.toLowerCase().includes(filterText.toLowerCase()));

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Ferdigheter i firma</Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
        <TextField
          label="Søk i ferdighetsnavn"
          value={filterText}
          onChange={(e) => setFilterText(e.target.value)}
          size="small"
        />
        <Autocomplete
          multiple
          options={skillNames}
          value={selectedFilters}
          onChange={(_, v) => setSelectedFilters(v)}
          renderInput={(params) => <TextField {...params} label="Filtrer på ferdigheter" size="small" />}
          sx={{ minWidth: 280 }}
        />
        <Button
          variant="outlined"
          size="small"
          onClick={() => fetchSkills(selectedFilters)}
          disabled={loading}
        >
          Bruk filter
        </Button>
      </Stack>

      {loading && <Typography>Henter ferdigheter…</Typography>}
      <Stack spacing={2}>
        {filteredSkills.map((s) => {
          const bestSet = bestBySkill[s.name] || new Set<string>();
          return (
            <Paper key={s.name} sx={{ p: 2 }} variant="outlined">
              <Stack direction="row" spacing={2} sx={{ alignItems: 'baseline', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <Typography variant="h6" sx={{ mr: 1 }}>{s.name}</Typography>
                  <Chip size="small" label={`${s.konsulenterMedSkill} konsulenter`} />
                  {bestSet.size > 0 && <Chip size="small" color="primary" icon={<StarIcon />} label={`Topp ${bestSet.size}`} />}
                </Stack>
                <Button
                  size="small"
                  variant="contained"
                  onClick={async () => {
                    // hent score for alle konsulenter i denne skillen og marker topp 3
                    const { getCvScore } = await import('../../services/cvScoreService');
                    const entries = await Promise.all(
                      s.konsulenter.map(async (c) => {
                        let score = scoresCache.current.get(c.userId);
                        if (score === undefined) {
                          try {
                            const dto = await getCvScore(c.userId);
                            score = dto.scorePercent;
                          } catch {
                            score = 0;
                          }
                          scoresCache.current.set(c.userId, score);
                        }
                        return { userId: c.userId, score };
                      })
                    );
                    const top = entries.sort((a, b) => b.score - a.score).slice(0, Math.min(3, entries.length));
                    setBestBySkill((prev) => ({ ...prev, [s.name]: new Set(top.map((t) => t.userId)) }));
                  }}
                >
                  Vis topp 3
                </Button>
              </Stack>
              <Box sx={{ mt: 1 }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>Konsulenter</Typography>
                <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                  {s.konsulenter.map((c) => (
                    <Chip
                      key={c.userId}
                      label={c.name}
                      onClick={() => navigate(`/cv/${encodeURIComponent(c.userId)}`)}
                      clickable
                      variant={bestSet.has(c.userId) ? 'filled' : 'outlined'}
                      color={bestSet.has(c.userId) ? 'primary' : 'default'}
                      icon={bestSet.has(c.userId) ? <StarIcon /> : undefined}
                    />
                  ))}
                  {s.konsulenter.length === 0 && (
                    <Typography variant="body2" color="text.secondary">Ingen</Typography>
                  )}
                </Stack>
              </Box>
            </Paper>
          );
        })}
        {!loading && filteredSkills.length === 0 && (
          <Typography>Ingen ferdigheter funnet.</Typography>
        )}
      </Stack>
    </Container>
  );
};

export default SkillsOverviewPage;