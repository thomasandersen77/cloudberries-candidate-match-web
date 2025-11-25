import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Tooltip,
  Typography,
  Box,
  CircularProgress,
  Alert
} from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';
import type { MatchResultsTableProps, MatchCandidate } from '../../types/matches';
import {
  getScoreVisualizationFromScore,
  formatScoreAsPercentage,
  truncateExplanation,
  formatRelativeTime,
  sortCandidatesByScore
} from '../../utils/matchUtils';

/**
 * Table component for displaying consultant match results with scores and explanations.
 * 
 * Features:
 * - Color-coded match scores
 * - Truncated explanations with tooltips
 * - Sorting by score (descending)
 * - Loading state support
 * - Responsive design
 */
const MatchResultsTable: React.FC<MatchResultsTableProps> = ({ matches, loading = false }) => {
  
  if (loading) {
    return (
      <Box display="flex" alignItems="center" justifyContent="center" py={4}>
        <CircularProgress size={24} sx={{ mr: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Computing consultant matches...
        </Typography>
      </Box>
    );
  }

  if (!matches || matches.length === 0) {
    return (
      <Alert severity="info" sx={{ my: 2 }}>
        <Typography variant="body2">
          No matches found for this project request. Try triggering the matching computation first.
        </Typography>
      </Alert>
    );
  }

  // Sort candidates by score for consistent display
  const sortedMatches = sortCandidatesByScore(matches);

  return (
    <TableContainer
      component={Paper}
      elevation={1}
      sx={{
        borderRadius: 3,
        overflow: 'hidden',
      }}
    >
      <Table size="small" aria-label="consultant matches table">
        <TableHead>
          <TableRow>
            <TableCell>Consultant</TableCell>
            <TableCell align="center" sx={{ minWidth: 100 }}>
              Match Score
            </TableCell>
            <TableCell sx={{ minWidth: 200 }}>Explanation</TableCell>
            <TableCell align="center" sx={{ minWidth: 120 }}>
              Computed
            </TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {sortedMatches.map((match, index) => (
            <MatchRow key={`${match.consultantId}-${match.createdAt}`} match={match} rank={index + 1} />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

/**
 * Individual row component for a consultant match result.
 */
interface MatchRowProps {
  match: MatchCandidate;
  rank: number;
}

const MatchRow: React.FC<MatchRowProps> = ({ match, rank }) => {
  const scoreViz = getScoreVisualizationFromScore(match.matchScore);
  const truncatedExplanation = truncateExplanation(match.matchExplanation, 120);
  const hasMoreContent = match.matchExplanation && match.matchExplanation.length > 120;

  return (
    <TableRow
      hover
      sx={{
        '&:nth-of-type(odd)': { backgroundColor: 'grey.25' },
        cursor: 'default'
      }}
    >
      <TableCell>
        <Box display="flex" alignItems="center" gap={1}>
          <Chip
            label={rank}
            size="small"
            color={rank <= 3 ? 'primary' : 'default'}
            variant={rank <= 3 ? 'filled' : 'outlined'}
            sx={{ minWidth: 32, fontWeight: 600 }}
          />
          <PersonIcon color="action" fontSize="small" />
          <Box>
            <Typography variant="body2" fontWeight={500}>
              {match.consultantName}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              ID: {match.userId}
            </Typography>
          </Box>
        </Box>
      </TableCell>
      
      <TableCell align="center">
        <Tooltip title={`${scoreViz.description} - ${formatScoreAsPercentage(match.matchScore, 2)}`}>
          <Chip
            label={formatScoreAsPercentage(match.matchScore)}
            size="small"
            sx={{
              backgroundColor: scoreViz.backgroundColor,
              color: scoreViz.color,
              fontWeight: 600,
              minWidth: 80
            }}
          />
        </Tooltip>
      </TableCell>
      
      <TableCell>
        {hasMoreContent ? (
          <Tooltip title={match.matchExplanation} arrow placement="top-start">
            <Typography
              variant="body2"
              color="text.secondary"
              sx={{
                cursor: 'help',
                '&:hover': { color: 'text.primary' }
              }}
            >
              {truncatedExplanation}
            </Typography>
          </Tooltip>
        ) : (
          <Typography variant="body2" color="text.secondary">
            {truncatedExplanation}
          </Typography>
        )}
      </TableCell>
      
      <TableCell align="center">
        <Tooltip title={`Computed at ${new Date(match.createdAt).toLocaleString()}`}>
          <Typography variant="caption" color="text.secondary">
            {formatRelativeTime(match.createdAt)}
          </Typography>
        </Tooltip>
      </TableCell>
    </TableRow>
  );
};

export default MatchResultsTable;