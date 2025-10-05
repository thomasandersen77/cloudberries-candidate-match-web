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
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Ferdigheter
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ingen ferdigheter tilgjengelig
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom>
        Ferdigheter
      </Typography>
      
      {/* General skills from consultant */}
      {hasGeneralSkills && (
        <Box sx={{ mb: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
            Hovedferdigheter
          </Typography>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
            {skills!.map((skill, index) => (
              <Chip
                key={index}
                label={skill}
                variant="filled"
                color="primary"
                size="medium"
              />
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
                <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'medium' }}>
                  {category.name}
                </Typography>
              )}
              <Grid container spacing={1}>
                {category.skills && category.skills.map((skill, skillIndex) => (
                  <Grid item key={skillIndex}>
                    <Chip
                      label={`${skill.name}${skill.durationYears ? ` (${skill.durationYears} år)` : ''}`}
                      variant="outlined"
                      color="secondary"
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