import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Collapse,
  Box,
  Typography,
  Chip,
  CircularProgress
} from '@mui/material';
import {
  KeyboardArrowDown as ArrowDownIcon,
  KeyboardArrowUp as ArrowUpIcon,
  CheckCircle as CheckIcon,
  HourglassEmpty as PendingIcon
} from '@mui/icons-material';
import MatchResultsTable from '../../components/matches/MatchResultsTable';
import type { MatchCandidate } from '../../types/matches';

/**
 * DTO for project request summary (matches OpenAPI spec).
 */
export interface ProjectRequestSummary {
  id: number;
  title: string | null;
  customerName: string;
  createdAt: string;
}

interface ProjectRequestsTableProps {
  projectRequests: ProjectRequestSummary[];
  onRowClick: (projectId: number) => void;
  expandedRowId: number | null;
  matchesData: Record<number, MatchCandidate[]>;
  loadingMatches: Record<number, boolean>;
}

/**
 * Table component for displaying project requests with expandable match results.
 * 
 * Features:
 * - Clickable rows that expand to show consultant matches
 * - Status indicators (computed/pending)
 * - Match count badges
 * - Loading states
 * - Responsive design
 */
const ProjectRequestsTable: React.FC<ProjectRequestsTableProps> = ({
  projectRequests,
  onRowClick,
  expandedRowId,
  matchesData,
  loadingMatches
}) => {
  
  if (projectRequests.length === 0) {
    return (
      <Paper sx={{ p: 4, textAlign: 'center' }}>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          No Project Requests Found
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Upload some project requests to start matching consultants.
        </Typography>
      </Paper>
    );
  }
  
  return (
    <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: 'grey.50' }}>
            <TableCell width={50} />
            <TableCell><strong>Customer</strong></TableCell>
            <TableCell><strong>Project Description</strong></TableCell>
            <TableCell align="center"><strong>Status</strong></TableCell>
            <TableCell align="center"><strong>Matches</strong></TableCell>
            <TableCell align="right"><strong>Created</strong></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {projectRequests.map((project) => (
            <ProjectRequestRow
              key={project.id}
              project={project}
              isExpanded={expandedRowId === project.id}
              matches={matchesData[project.id]}
              loading={loadingMatches[project.id]}
              onRowClick={() => onRowClick(project.id)}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

interface ProjectRequestRowProps {
  project: ProjectRequestSummary;
  isExpanded: boolean;
  matches?: MatchCandidate[];
  loading?: boolean;
  onRowClick: () => void;
}

/**
 * Individual row component for a project request with expand/collapse functionality.
 */
const ProjectRequestRow: React.FC<ProjectRequestRowProps> = ({
  project,
  isExpanded,
  matches,
  loading,
  onRowClick
}) => {
  
  const hasMatches = matches && matches.length > 0;
  const matchCount = matches?.length ?? 0;
  
  return (
    <>
      <TableRow
        hover
        onClick={onRowClick}
        sx={{
          cursor: 'pointer',
          '&:hover': { backgroundColor: 'action.hover' },
          backgroundColor: isExpanded ? 'action.selected' : 'inherit'
        }}
      >
        <TableCell>
          <IconButton size="small" aria-label={isExpanded ? 'collapse row' : 'expand row'}>
            {isExpanded ? <ArrowUpIcon /> : <ArrowDownIcon />}
          </IconButton>
        </TableCell>
        
        <TableCell>
          <Typography variant="body2" fontWeight={500}>
            {project.customerName}
          </Typography>
        </TableCell>
        
        <TableCell>
          <Typography 
            variant="body2" 
            color="text.secondary"
            sx={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical'
            }}
          >
            {project.title ?? 'No description available'}
          </Typography>
        </TableCell>
        
        <TableCell align="center">
          {loading ? (
            <CircularProgress size={20} />
          ) : hasMatches ? (
            <Chip
              icon={<CheckIcon />}
              label="Computed"
              size="small"
              color="success"
              variant="outlined"
            />
          ) : (
            <Chip
              icon={<PendingIcon />}
              label="Pending"
              size="small"
              color="warning"
              variant="outlined"
            />
          )}
        </TableCell>
        
        <TableCell align="center">
          {hasMatches ? (
            <Chip 
              label={matchCount} 
              size="small" 
              color="primary"
              sx={{ fontWeight: 600, minWidth: 40 }}
            />
          ) : (
            <Typography variant="caption" color="text.disabled">
              -
            </Typography>
          )}
        </TableCell>
        
        <TableCell align="right">
          <Typography variant="caption" color="text.secondary">
            {new Date(project.createdAt).toLocaleDateString('no-NO', {
              year: 'numeric',
              month: 'short',
              day: 'numeric'
            })}
          </Typography>
        </TableCell>
      </TableRow>
      
      <TableRow>
        <TableCell 
          style={{ paddingBottom: 0, paddingTop: 0 }} 
          colSpan={6}
          sx={{ backgroundColor: 'grey.25' }}
        >
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" component="div" color="primary.main">
                  Top Consultant Matches
                </Typography>
                {hasMatches && (
                  <Typography variant="caption" color="text.secondary">
                    Showing {matchCount} {matchCount === 1 ? 'match' : 'matches'}
                  </Typography>
                )}
              </Box>
              <MatchResultsTable matches={matches ?? []} loading={loading} />
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </>
  );
};

export default ProjectRequestsTable;
