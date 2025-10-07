import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Alert,
  Button,
  CircularProgress,
  Paper,
  Stack,
  Snackbar
} from '@mui/material';
import {
  PlayArrow as PlayArrowIcon,
  Refresh as RefreshIcon,
  Analytics as AnalyticsIcon
} from '@mui/icons-material';
import { projectMatchesService } from '../../services/projectMatchesService';
import ProjectMatchCard from '../../components/matches/ProjectMatchCard';
import type {
  MatchesPageState,
  TriggerMatchingResponse
} from '../../types/matches';

/**
 * Main page for consultant matching functionality.
 * 
 * Features:
 * - Lists all project requests
 * - Manual matching triggers per project
 * - Batch matching operation
 * - Real-time match results display
 * - Error handling and user feedback
 */
const ProjectMatchingPage: React.FC = () => {
  const [state, setState] = useState<MatchesPageState>({
    projectRequests: [],
    expandedProjectId: null,
    matches: {},
    loading: {},
    error: null
  });
  const [initialLoading, setInitialLoading] = useState(true);
  const [batchLoading, setBatchLoading] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string | null>(null);

  // Load project requests on mount
  useEffect(() => {
    loadProjectRequests();
  }, []);

  /**
   * Loads all project requests from the backend.
   */
  const loadProjectRequests = async () => {
    try {
      setInitialLoading(true);
      const requests = await projectMatchesService.listProjectRequests();
      setState(prev => ({
        ...prev,
        projectRequests: requests,
        error: null
      }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load project requests';
      setState(prev => ({ ...prev, error: message }));
    } finally {
      setInitialLoading(false);
    }
  };

  /**
   * Loads matches for a specific project request.
   */
  const loadMatches = async (projectId: number) => {
    try {
      const matches = await projectMatchesService.getTopMatches(projectId);
      if (matches) {
        setState(prev => ({
          ...prev,
          matches: { ...prev.matches, [projectId]: matches.matches }
        }));
      }
    } catch (error) {
      console.error(`Failed to load matches for project ${projectId}:`, error);
    }
  };

  /**
   * Handles manual matching trigger for a project.
   */
  const handleTriggerMatching = async (projectId: number, forceRecompute: boolean = false) => {
    setState(prev => ({
      ...prev,
      loading: { ...prev.loading, [projectId]: true },
      error: null
    }));

    try {
      const response: TriggerMatchingResponse = await projectMatchesService.triggerMatching(
        projectId, 
        forceRecompute
      );
      
      setSnackbarMessage(response.message);
      
      // Wait a moment then try to load matches
      setTimeout(async () => {
        try {
          const matches = await projectMatchesService.waitForMatches(projectId, 15, 3000);
          if (matches) {
            setState(prev => ({
              ...prev,
              matches: { ...prev.matches, [projectId]: matches.matches },
              expandedProjectId: projectId // Auto-expand to show results
            }));
            setSnackbarMessage(`✅ Found ${matches.matches.length} consultant matches!`);
          } else {
            setSnackbarMessage('⚠️ Matching is taking longer than expected. Please check results manually.');
          }
        } catch (error) {
          console.error('Failed to wait for matches:', error);
        } finally {
          setState(prev => ({
            ...prev,
            loading: { ...prev.loading, [projectId]: false }
          }));
        }
      }, 2000);
      
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to trigger matching';
      setState(prev => ({
        ...prev,
        error: message,
        loading: { ...prev.loading, [projectId]: false }
      }));
      setSnackbarMessage(`❌ ${message}`);
    }
  };

  /**
   * Handles expanding/collapsing project match results.
   */
  const handleToggleExpand = async (projectId: number) => {
    const isCurrentlyExpanded = state.expandedProjectId === projectId;
    const newExpandedId = isCurrentlyExpanded ? null : projectId;
    
    setState(prev => ({ ...prev, expandedProjectId: newExpandedId }));
    
    // Load matches if expanding and no matches are loaded
    if (!isCurrentlyExpanded && !state.matches[projectId]) {
      await loadMatches(projectId);
    }
  };

  /**
   * Handles batch matching for all projects.
   */
  const handleBatchMatching = async () => {
    setBatchLoading(true);
    try {
      const response = await projectMatchesService.triggerAllMatches(false);
      setSnackbarMessage(`🚀 ${response.message}`);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to trigger batch matching';
      setState(prev => ({ ...prev, error: message }));
      setSnackbarMessage(`❌ ${message}`);
    } finally {
      setBatchLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
        <Box display="flex" alignItems="center" gap={2}>
          <CircularProgress />
          <Typography variant="h6">Loading project requests...</Typography>
        </Box>
      </Container>
    );
  }

  if (state.error && state.projectRequests.length === 0) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4 }}>
        <Alert severity="error" action={
          <Button color="inherit" onClick={loadProjectRequests}>
            Retry
          </Button>
        }>
          <Typography variant="h6" gutterBottom>Failed to Load Projects</Typography>
          {state.error}
        </Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      {/* Header */}
      <Paper sx={{ p: 3, mb: 3, backgroundColor: 'primary.50' }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box>
            <Typography variant="h4" component="h1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AnalyticsIcon color="primary" />
              Project Consultant Matching
            </Typography>
            <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
              AI-powered consultant matching for project requests. Trigger matching computations 
              and view ranked consultant recommendations based on skills, experience, and project requirements.
            </Typography>
          </Box>
          
          <Stack direction="row" spacing={2}>
            <Button
              variant="outlined"
              startIcon={<RefreshIcon />}
              onClick={loadProjectRequests}
              disabled={initialLoading}
            >
              Refresh
            </Button>
            <Button
              variant="contained"
              startIcon={<PlayArrowIcon />}
              onClick={handleBatchMatching}
              disabled={batchLoading || state.projectRequests.length === 0}
              color="secondary"
            >
              {batchLoading ? 'Processing...' : 'Batch Match All'}
            </Button>
          </Stack>
        </Box>
      </Paper>

      {/* Error Alert */}
      {state.error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setState(prev => ({ ...prev, error: null }))}>
          {state.error}
        </Alert>
      )}

      {/* Project Cards */}
      {state.projectRequests.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No Project Requests Found
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Upload some project requests to start matching consultants.
          </Typography>
        </Paper>
      ) : (
        <Box>
          <Typography variant="h5" gutterBottom>
            Project Requests ({state.projectRequests.length})
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Click "Compute Matches" to find the best consultants for each project. 
            Results are ranked by AI-computed relevance scores.
          </Typography>
          
          {state.projectRequests.map(project => (
            <ProjectMatchCard
              key={project.id}
              project={project}
              isExpanded={state.expandedProjectId === project.id}
              matches={state.matches[project.id]}
              loading={state.loading[project.id]}
              onToggleExpand={handleToggleExpand}
              onTriggerMatching={handleTriggerMatching}
            />
          ))}
        </Box>
      )}

      {/* Success/Error Snackbar */}
      <Snackbar
        open={!!snackbarMessage}
        autoHideDuration={6000}
        onClose={() => setSnackbarMessage(null)}
        message={snackbarMessage}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      />
    </Container>
  );
};

export default ProjectMatchingPage;