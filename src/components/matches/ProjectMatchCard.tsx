import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Box,
  Collapse,
  Divider,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Business as BusinessIcon,
  Schedule as ScheduleIcon
} from '@mui/icons-material';
import type { ProjectCardProps } from '../../types/matches';
import { formatRelativeTime } from '../../utils/matchUtils';
import MatchResultsTable from './MatchResultsTable';

/**
 * Card component for displaying a project request with matching functionality.
 * 
 * Features:
 * - Project information display
 * - Trigger matching buttons (compute/recompute)
 * - Expandable match results section
 * - Loading states and error handling
 * - Responsive design
 */
const ProjectMatchCard: React.FC<ProjectCardProps> = ({
  project,
  isExpanded,
  matches,
  loading = false,
  onToggleExpand,
  onTriggerMatching
}) => {
  
  const hasMatches = matches && matches.length > 0;
  const matchCount = matches?.length || 0;

  const handleTriggerCompute = () => {
    onTriggerMatching(project.id, false);
  };

  const handleTriggerRecompute = () => {
    onTriggerMatching(project.id, true);
  };

  const handleToggleExpand = () => {
    onToggleExpand(project.id);
  };

  return (
    <Card elevation={2} sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
          <Box flex={1} mr={2}>
            <Typography variant="h6" component="h3" gutterBottom>
              {project.title}
            </Typography>
            
            <Box display="flex" alignItems="center" gap={2} mb={1}>
              <Box display="flex" alignItems="center" gap={0.5}>
                <BusinessIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {project.customerName}
                </Typography>
              </Box>
              
              <Box display="flex" alignItems="center" gap={0.5}>
                <ScheduleIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {formatRelativeTime(project.createdAt)}
                </Typography>
              </Box>
            </Box>

            {hasMatches && (
              <Chip
                label={`${matchCount} consultant${matchCount !== 1 ? 's' : ''} matched`}
                size="small"
                color="success"
                variant="outlined"
              />
            )}
          </Box>

          <Box display="flex" alignItems="center" gap={1}>
            {hasMatches && (
              <Tooltip title={isExpanded ? 'Hide results' : 'Show results'}>
                <IconButton
                  onClick={handleToggleExpand}
                  size="small"
                  color="primary"
                >
                  {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>
      </CardContent>

      <CardActions sx={{ pt: 0, pb: 2, px: 2 }}>
        <Box display="flex" gap={1} alignItems="center" flexWrap="wrap">
          <Button
            variant="contained"
            startIcon={<PlayArrowIcon />}
            onClick={handleTriggerCompute}
            disabled={loading}
            size="small"
            sx={{ minWidth: 140 }}
          >
            {loading ? 'Computing...' : 'Compute Matches'}
          </Button>
          
          {hasMatches && (
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={handleTriggerRecompute}
              disabled={loading}
              size="small"
              sx={{ minWidth: 120 }}
            >
              Recompute
            </Button>
          )}
          
          {hasMatches && !isExpanded && (
            <Button
              variant="text"
              endIcon={<ExpandMoreIcon />}
              onClick={handleToggleExpand}
              size="small"
              color="primary"
            >
              Show Results ({matchCount})
            </Button>
          )}
        </Box>
      </CardActions>

      {hasMatches && (
        <>
          <Divider />
          <Collapse in={isExpanded} timeout="auto">
            <CardContent sx={{ pt: 2 }}>
              <Box mb={2}>
                <Typography variant="h6" gutterBottom>
                  Top Consultant Matches
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>
                  AI-computed matches ranked by relevance score and project requirements
                </Typography>
              </Box>
              
              <MatchResultsTable matches={matches} loading={loading && isExpanded} />
            </CardContent>
          </Collapse>
        </>
      )}
    </Card>
  );
};

export default ProjectMatchCard;