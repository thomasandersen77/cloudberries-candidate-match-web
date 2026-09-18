import React from 'react';
import { Box, Button, Chip, Paper, Typography } from '@mui/material';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import type { SkillCategoryDto } from '../../types/api';
import { countSkills, rankSkillsByDuration } from '../../utils/skillUtils';

interface SkillsOverviewProps {
  skillCategories: SkillCategoryDto[];
  /** The three the backend picked as the person's main skills. */
  skills?: string[];
  /** Where "all N skills" goes: the full CV page. */
  onShowAll: () => void;
  /** How many of the longest-held skills to show. */
  limit?: number;
}

/**
 * What the person is strongest at, on one screen.
 *
 * The detail page used to render the CV's whole skills section: for a senior consultant that is
 * eleven categories and 133 chips, a screen and a half, under a "Hovedferdigheter" row of three
 * that drowned in it. The intro promises "nøkkeltall og kompetanse", and the full list is what
 * "Se hele CV" is for. So: the main skills, the fifteen with the most years behind them, one line
 * on how the categories are sized, and a link to the rest.
 */
const SkillsOverview: React.FC<SkillsOverviewProps> = ({ skillCategories, skills, onShowAll, limit = 15 }) => {
  const total = countSkills(skillCategories);
  const hasMain = (skills?.length ?? 0) > 0;

  if (total === 0 && !hasMain) {
    return (
      <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.01em', mb: 2 }}>
          Ferdigheter
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ingen ferdigheter tilgjengelig
        </Typography>
      </Paper>
    );
  }

  const ranked = rankSkillsByDuration(skillCategories, limit);
  // Nobody wrote years on this CV: the first skills as listed, so the section is not empty.
  const fallback = ranked.length === 0
    ? skillCategories.flatMap(c => c.skills ?? []).map(s => s.name?.trim()).filter((n): n is string => !!n).slice(0, limit)
    : [];
  const categories = skillCategories
    .map(c => ({ name: c.name?.trim(), count: c.skills?.filter(s => s.name?.trim()).length ?? 0 }))
    .filter((c): c is { name: string; count: number } => !!c.name && c.count > 0)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'no'));

  return (
    <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.01em', mb: 2 }}>
        Ferdigheter
      </Typography>

      {hasMain && (
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            Hovedferdigheter
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {skills!.map(skill => (
              <Chip key={skill} label={skill} size="small" color="primary" variant="outlined" />
            ))}
          </Box>
        </Box>
      )}

      {(ranked.length > 0 || fallback.length > 0) && (
        <Box sx={{ mb: 2.5 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}>
            {ranked.length > 0 ? 'Mest erfaring' : 'Fra CV-en'}
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {ranked.map(s => (
              <Chip key={s.name} label={`${s.name} (${s.durationYears} år)`} size="small" variant="outlined" />
            ))}
            {fallback.map(name => (
              <Chip key={name} label={name} size="small" variant="outlined" />
            ))}
          </Box>
        </Box>
      )}

      {categories.length > 0 && (
        <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
          {categories.length === 1 ? '1 kategori: ' : `${categories.length} kategorier: `}
          {categories.map(c => `${c.name} · ${c.count}`).join(', ')}
        </Typography>
      )}

      {total > 0 && (
        <Button
          variant="text"
          size="small"
          onClick={onShowAll}
          endIcon={<ArrowForwardIcon sx={{ fontSize: 16 }} />}
          sx={{ textTransform: 'none', px: 0.5, ml: -0.5 }}
        >
          {total === 1 ? 'Den ene ferdigheten i CV-en' : `Alle ${total} ferdigheter i CV-en`}
        </Button>
      )}
    </Paper>
  );
};

export default SkillsOverview;
