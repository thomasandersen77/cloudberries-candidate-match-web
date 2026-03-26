import React from 'react';
import {
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Box,
  Collapse,
  IconButton,
  Tooltip,
  Stack,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { ExpandMore, ExpandLess } from '@mui/icons-material';
import type { ProjectExperienceDto } from '../../types/api';

interface ProjectExperienceTableProps {
  projectExperience: ProjectExperienceDto[];
}

const formatYearMonth = (yearMonth: string | null | undefined): string => {
  if (!yearMonth) return '';
  const [year, month] = yearMonth.split('-');
  if (month) {
    return `${month}/${year}`;
  }
  return year || '';
};

const sortProjectExperience = (projects: ProjectExperienceDto[]): ProjectExperienceDto[] => {
  return projects.slice().sort((a, b) => {
    const aTo = a.toYearMonth || '';
    const bTo = b.toYearMonth || '';

    if (aTo !== bTo) {
      return bTo.localeCompare(aTo);
    }

    const aFrom = a.fromYearMonth || '';
    const bFrom = b.fromYearMonth || '';
    return bFrom.localeCompare(aFrom);
  });
};

const ProjectRow: React.FC<{ project: ProjectExperienceDto }> = ({ project }) => {
  const theme = useTheme();
  const [expanded, setExpanded] = React.useState(false);
  const hasDetails = Boolean(
    project.longDescription ||
      (project.roles && project.roles.length > 0) ||
      (project.skills && project.skills.length > 3)
  );
  const panelBg =
    theme.palette.mode === 'light'
      ? alpha('#ECE7E1', 0.35)
      : alpha(theme.palette.common.white, 0.04);

  return (
    <React.Fragment>
      <TableRow hover>
        <TableCell>
          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
            {project.customer || 'Ikke oppgitt'}
          </Typography>
        </TableCell>
        <TableCell>
          <Box sx={{ maxWidth: 320 }}>
            <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.55 }} noWrap>
              {project.description || 'Ingen beskrivelse'}
            </Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {project.skills &&
              project.skills.slice(0, 3).map((skill, skillIndex) => (
                <Chip key={skillIndex} label={skill} size="small" variant="outlined" color="default" />
              ))}
            {project.skills && project.skills.length > 3 && (
              <Chip label={`+${project.skills.length - 3} flere`} size="small" variant="outlined" color="default" />
            )}
          </Box>
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {formatYearMonth(project.fromYearMonth)}
          </Typography>
        </TableCell>
        <TableCell>
          <Typography variant="body2" color="text.secondary">
            {project.toYearMonth ? formatYearMonth(project.toYearMonth) : 'Pågående'}
          </Typography>
        </TableCell>
        <TableCell align="right" sx={{ width: 56 }}>
          {hasDetails && (
            <Tooltip title={expanded ? 'Skjul detaljer' : 'Vis detaljer'}>
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
                aria-expanded={expanded}
                sx={{
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 1.5,
                }}
              >
                {expanded ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
        </TableCell>
      </TableRow>
      {hasDetails && (
        <TableRow>
          <TableCell colSpan={6} sx={{ py: 0, border: 0, bgcolor: 'transparent' }}>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Box
                sx={{
                  py: 2.5,
                  px: 2.5,
                  mx: 1,
                  mb: 1.5,
                  borderRadius: 2,
                  bgcolor: panelBg,
                  border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
                }}
              >
                {project.longDescription && (
                  <Box sx={{ mb: 2.5 }}>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary' }}
                    >
                      Teknisk omfang
                    </Typography>
                    <Typography variant="body2" sx={{ mt: 1, lineHeight: 1.65 }}>
                      {project.longDescription}
                    </Typography>
                  </Box>
                )}
                {project.roles && project.roles.length > 0 && (
                  <Box sx={{ mb: project.skills && project.skills.length > 3 ? 2.5 : 0 }}>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary' }}
                    >
                      Rolle
                    </Typography>
                    <Stack spacing={1.5} sx={{ mt: 1 }}>
                      {project.roles.map((role, roleIndex) => (
                        <Box key={roleIndex}>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            {role.name}
                          </Typography>
                          {role.description && (
                            <>
                              <Typography
                                variant="caption"
                                sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'text.secondary', display: 'block', mt: 0.75 }}
                              >
                                Bidrag
                              </Typography>
                              <Typography variant="body2" color="text.secondary" sx={{ lineHeight: 1.65 }}>
                                {role.description}
                              </Typography>
                            </>
                          )}
                        </Box>
                      ))}
                    </Stack>
                  </Box>
                )}
                {project.skills && project.skills.length > 3 && (
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{ fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'text.secondary', display: 'block', mb: 1 }}
                    >
                      Ferdigheter
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {project.skills.map((skill, skillIndex) => (
                        <Chip key={skillIndex} label={skill} size="small" variant="outlined" color="default" />
                      ))}
                    </Box>
                  </Box>
                )}
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </React.Fragment>
  );
};

const ProjectExperienceTable: React.FC<ProjectExperienceTableProps> = ({ projectExperience }) => {
  if (!projectExperience || projectExperience.length === 0) {
    return (
      <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.01em', mb: 1 }}>
          Prosjekterfaring
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Ingen prosjekterfaring tilgjengelig
        </Typography>
      </Paper>
    );
  }

  const sortedProjects = sortProjectExperience(projectExperience);

  return (
    <Paper elevation={0} sx={{ p: { xs: 2.5, md: 3 }, mb: 3, overflow: 'hidden' }}>
      <Typography variant="h6" sx={{ fontWeight: 600, letterSpacing: '-0.01em', mb: 2 }}>
        Prosjekterfaring
      </Typography>
      <TableContainer>
        <Table size="medium">
          <TableHead>
            <TableRow>
              <TableCell>Kunde</TableCell>
              <TableCell>Beskrivelse</TableCell>
              <TableCell>Nøkkelferdigheter</TableCell>
              <TableCell>Fra</TableCell>
              <TableCell>Til</TableCell>
              <TableCell align="right" sx={{ width: 56 }} />
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedProjects.map((project, index) => (
              <ProjectRow key={`${project.customer}-${index}`} project={project} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default ProjectExperienceTable;
