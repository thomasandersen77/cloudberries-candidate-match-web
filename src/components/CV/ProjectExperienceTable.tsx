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
  Tooltip
} from '@mui/material';
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

const ProjectRow: React.FC<{ project: ProjectExperienceDto; index: number }> = ({ project }) => {
  const [expanded, setExpanded] = React.useState(false);
  const hasDetails = project.longDescription || (project.roles && project.roles.length > 0);

  return (
    <React.Fragment>
      <TableRow hover>
        <TableCell component="th" scope="row">
          {project.customer || 'Ikke oppgitt'}
        </TableCell>
        <TableCell>
          <Box sx={{ maxWidth: 300 }}>
            <Typography variant="body2" noWrap>
              {project.description || 'Ingen beskrivelse'}
            </Typography>
          </Box>
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
            {project.skills && project.skills.slice(0, 3).map((skill, skillIndex) => (
              <Chip
                key={skillIndex}
                label={skill}
                size="small"
                variant="outlined"
                color="primary"
              />
            ))}
            {project.skills && project.skills.length > 3 && (
              <Chip 
                label={`+${project.skills.length - 3} flere`} 
                size="small" 
                variant="outlined" 
              />
            )}
          </Box>
        </TableCell>
        <TableCell>
          {formatYearMonth(project.fromYearMonth)}
        </TableCell>
        <TableCell>
          {project.toYearMonth ? formatYearMonth(project.toYearMonth) : 'Pågående'}
        </TableCell>
        <TableCell>
          {hasDetails && (
            <Tooltip title={expanded ? 'Skjul detaljer' : 'Vis detaljer'}>
              <IconButton
                size="small"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? <ExpandLess /> : <ExpandMore />}
              </IconButton>
            </Tooltip>
          )}
        </TableCell>
      </TableRow>
      {hasDetails && (
        <TableRow>
          <TableCell colSpan={6} sx={{ py: 0, border: 0 }}>
            <Collapse in={expanded} timeout="auto" unmountOnExit>
              <Box sx={{ py: 2, pl: 2 }}>
                {project.longDescription && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Detaljert beskrivelse:
                    </Typography>
                    <Typography variant="body2">
                      {project.longDescription}
                    </Typography>
                  </Box>
                )}
                {project.roles && project.roles.length > 0 && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Roller:
                    </Typography>
                    {project.roles.map((role, roleIndex) => (
                      <Box key={roleIndex} sx={{ mb: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 'medium' }}>
                          {role.name}
                        </Typography>
                        {role.description && (
                          <Typography variant="body2" color="text.secondary">
                            {role.description}
                          </Typography>
                        )}
                      </Box>
                    ))}
                  </Box>
                )}
                {project.skills && project.skills.length > 3 && (
                  <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                      Alle ferdigheter:
                    </Typography>
                    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                      {project.skills.map((skill, skillIndex) => (
                        <Chip
                          key={skillIndex}
                          label={skill}
                          size="small"
                          variant="outlined"
                          color="secondary"
                        />
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
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
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
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        Prosjekterfaring
      </Typography>
      <TableContainer>
        <Table size="medium">
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Kunde</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Beskrivelse</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Nøkkelferdigheter</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Fra</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Til</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: 50 }}>Detaljer</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedProjects.map((project, index) => (
              <ProjectRow key={index} project={project} index={index} />
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};

export default ProjectExperienceTable;