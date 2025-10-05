import React, { useEffect, useRef, useState } from 'react';
import { Autocomplete, Box, Chip, Container, Paper, Stack, TextField, Typography, Button, CircularProgress } from '@mui/material';
import { listSkillSummary, listConsultantsBySkill, listSkillNames } from '../../services/skillsService';
import type { PageSkillSummaryDto, ConsultantSummaryDto, SkillSummaryDto } from '../../types/api';
import { useNavigate } from 'react-router-dom';

const SkillsOverviewPage: React.FC = () => {
  const [items, setItems] = useState<{ name: string; consultantCount: number }[]>([]);
  const [page, setPage] = useState(0);
  const [size] = useState(25);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  const [q, setQ] = useState('');
  const [skillOptions, setSkillOptions] = useState<string[]>([]);

  // per-skill consultants cache
  const [consultantsBySkill, setConsultantsBySkill] = useState<Record<string, { items: ConsultantSummaryDto[]; page: number; last: boolean }>>({});

  const navigate = useNavigate();
  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadingMoreRef = useRef(false);

  const loadPage = React.useCallback(async (nextPage: number, reset: boolean = false) => {
    if (loadingMoreRef.current) return;
    loadingMoreRef.current = true;
    setLoading(true);
    try {
      const res: PageSkillSummaryDto = await listSkillSummary({ q, page: nextPage, size, sort: 'consultantCount,desc' });
      const newItems = (res.content ?? []).map((s: SkillSummaryDto) => ({ name: s.name!, consultantCount: s.consultantCount! }));
      setItems(prev => reset ? newItems : [...prev, ...newItems]);
      setHasMore(res.last === false);
      setPage(res.number ?? nextPage);
    } finally {
      setLoading(false);
      loadingMoreRef.current = false;
    }
  }, [q, size]);

  useEffect(() => {
    // initial load
    setItems([]);
    setPage(0);
    setHasMore(true);
    loadPage(0, true);
  }, [q, loadPage]);

  useEffect(() => {
    // load skill names for autocomplete
    (async () => {
      try {
        const names = await listSkillNames();
        setSkillOptions(names);
      } catch {
        setSkillOptions([]);
      }
    })();
  }, []);

  useEffect(() => {
    if (!sentinelRef.current) return;
    observerRef.current?.disconnect();
    observerRef.current = new IntersectionObserver(entries => {
      const first = entries[0];
      if (first.isIntersecting && hasMore && !loading) {
        loadPage(page + 1);
      }
    });
    observerRef.current.observe(sentinelRef.current);
    return () => observerRef.current?.disconnect();
  }, [page, hasMore, loading, loadPage]);

  const toggleLoadConsultants = async (skill: string) => {
    const current = consultantsBySkill[skill];
    if (current && current.items.length > 0) {
      // collapse
      setConsultantsBySkill(prev => ({ ...prev, [skill]: { items: [], page: 0, last: false } }));
      return;
    }
    // load first page
    const res = await listConsultantsBySkill(skill, { page: 0, size: 10, sort: 'name,asc' });
    setConsultantsBySkill(prev => ({ ...prev, [skill]: { items: res.content ?? [], page: res.number ?? 0, last: res.last ?? true } }));
  };

  const loadMoreConsultants = async (skill: string) => {
    const current = consultantsBySkill[skill];
    if (!current || current.last) return;
    const nextPage = (current.page ?? 0) + 1;
    const res = await listConsultantsBySkill(skill, { page: nextPage, size: 10, sort: 'name,asc' });
    setConsultantsBySkill(prev => ({
      ...prev,
      [skill]: {
        items: [...(current.items ?? []), ...(res.content ?? [])],
        page: res.number ?? nextPage,
        last: res.last ?? true,
      }
    }));
  };

  return (
    <Container sx={{ py: 4 }}>
      <Typography variant="h4" gutterBottom>Ferdigheter i firma</Typography>

      <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2} sx={{ mb: 2, alignItems: 'center' }}>
        <TextField
          label="Søk i ferdighetsnavn"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          size="small"
        />
        <Autocomplete
          multiple
          options={skillOptions}
          value={[]}
          onChange={() => { /* deprecated multi-filter removed in new API */ }}
          renderInput={(params) => <TextField {...params} label="(Autofullfør)" size="small" />}
          sx={{ minWidth: 280 }}
        />
      </Stack>

      <Stack spacing={2}>
        {items.map((s) => {
          const skillKey = s.name;
          const cons = consultantsBySkill[skillKey]?.items ?? [];
          const last = consultantsBySkill[skillKey]?.last ?? true;
          const expanded = cons.length > 0;
          return (
            <Paper key={skillKey} sx={{ p: 2 }} variant="outlined">
              <Stack direction="row" spacing={2} sx={{ alignItems: 'baseline', flexWrap: 'wrap', justifyContent: 'space-between' }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'baseline', flexWrap: 'wrap' }}>
                  <Typography variant="h6" sx={{ mr: 1 }}>{s.name}</Typography>
                  <Chip size="small" label={`${s.consultantCount} konsulenter`} />
                </Stack>
                <Button
                  size="small"
                  variant="contained"
                  onClick={() => toggleLoadConsultants(skillKey)}
                >
                  {expanded ? 'Skjul konsulenter' : 'Vis konsulenter'}
                </Button>
              </Stack>
              {expanded && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>Konsulenter</Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap' }}>
                    {cons.map((c) => (
                      <Chip
                        key={c.userId}
                        label={c.name}
                        onClick={() => navigate(`/cv/${encodeURIComponent(c.userId)}`)}
                        clickable
                        variant={'outlined'}
                        color={'default'}
                      />
                    ))}
                    {cons.length === 0 && (
                      <Typography variant="body2" color="text.secondary">Ingen</Typography>
                    )}
                  </Stack>
                  {!last && (
                    <Button size="small" sx={{ mt: 1 }} onClick={() => loadMoreConsultants(skillKey)}>Vis flere</Button>
                  )}
                </Box>
              )}
            </Paper>
          );
        })}
        <Box ref={sentinelRef} sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
          {loading && <CircularProgress size={24} />}
        </Box>
        {!loading && items.length === 0 && (
          <Typography>Ingen ferdigheter funnet.</Typography>
        )}
      </Stack>
    </Container>
  );
};

export default SkillsOverviewPage;