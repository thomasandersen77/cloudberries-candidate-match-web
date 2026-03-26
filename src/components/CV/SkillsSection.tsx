import React from 'react';
import { Box, Typography, Chip, Paper, Grid } from '@mui/material';
import type { SkillCategoryDto } from '../../types/api';

interface SkillsSectionProps {
  skillCategories: SkillCategoryDto[];
  skills?: string[]; // Additional skills array from consultant
}

const SkillsSection: React.FC<SkillsSectionProps> = ({ skillCategories, skills }) => {
  const hasSkillCategories = skillCategories && skillCategories.length > 0;
  const hasGeneralSkills = skills && skills.length > 0;

  if (!hasSkillCategories && !hasGeneralSkills) {
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

  return (
    <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, mb: 3 }}>
      <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.01em', mb: 2 }}>
        Ferdigheter
      </Typography>
      
      {/* General skills from consultant */}
      {hasGeneralSkills && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.secondary' }}>
            Hovedferdigheter
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
            {skills!.map((skill, index) => (
              <Chip key={index} label={skill} variant="outlined" color="default" size="small" />
            ))}
          </Box>
        </Box>
      )}

      {/* Categorized skills from CV */}
      {hasSkillCategories && (
        <Box>
          {skillCategories.map((category, categoryIndex) => (
            <Box key={categoryIndex} sx={{ mb: 3 }}>
              {category.name && (
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: 'text.secondary' }}>
                  {category.name}
                </Typography>
              )}
              <Grid container spacing={0.75}>
                {category.skills && category.skills.map((skill, skillIndex) => (
                  <Grid item key={skillIndex}>
                    <Chip
                      label={`${skill.name}${skill.durationYears ? ` (${skill.durationYears} år)` : ''}`}
                      variant="outlined"
                      color="default"
                      size="small"
                    />
                  </Grid>
                ))}
              </Grid>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

export default SkillsSection;