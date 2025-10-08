import apiClient from './apiClient';
import type {
  ProjectRequestSummary,
  MatchTop10Response,
  TriggerMatchingResponse,
  MatchesHealthResponse,
  BatchMatchingResponse
} from '../types/matches';

/**
 * API service for project consultant matching operations.
 * Provides methods to interact with the backend matching endpoints.
 */
export class ProjectMatchesService {
  
  /**
   * Fetches all project requests available for matching.
   */
  async listProjectRequests(): Promise<ProjectRequestSummary[]> {
    try {
      const response = await apiClient.get<ProjectRequestSummary[]>('/matches/requests');
      return response.data;
    } catch (error) {
      console.error('Failed to list project requests:', error);
      throw new Error('Failed to fetch project requests');
    }
  }

  /**
   * Triggers matching computation for a specific project request.
   * 
   * @param projectRequestId - The ID of the project request
   * @param forceRecompute - Whether to recompute even if matches exist
   */
  async triggerMatching(
    projectRequestId: number, 
    forceRecompute: boolean = false
  ): Promise<TriggerMatchingResponse> {
    try {
      const response = await apiClient.post<TriggerMatchingResponse>(
        `/matches/requests/${projectRequestId}/trigger`,
        null,
        { params: { forceRecompute } }
      );
      return response.data;
    } catch (error) {
      console.error(`Failed to trigger matching for project ${projectRequestId}:`, error);
      throw new Error(`Failed to trigger matching: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets computed matches for a project request.
   * Returns the top 10 consultant matches with scores and explanations.
   * 
   * @param projectRequestId - The ID of the project request
   */
  async getTopMatches(projectRequestId: number): Promise<MatchTop10Response | null> {
    try {
      const response = await apiClient.get<MatchTop10Response>(`/matches/requests/${projectRequestId}/top`);
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          // No matches found, return null instead of throwing
          return null;
        }
      }
      console.error(`Failed to get matches for project ${projectRequestId}:`, error);
      throw new Error(`Failed to fetch matches: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Gets match results for a project request (alternative endpoint).
   * 
   * @param projectRequestId - The ID of the project request
   */
  async getMatchResults(projectRequestId: number): Promise<MatchTop10Response | null> {
    try {
      const response = await apiClient.get<MatchTop10Response>(`/matches/requests/${projectRequestId}/results`);
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) {
          return null;
        }
      }
      console.error(`Failed to get match results for project ${projectRequestId}:`, error);
      throw new Error(`Failed to fetch match results: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Triggers matching for all project requests (admin operation).
   * 
   * @param forceRecompute - Whether to recompute even if matches exist
   */
  async triggerAllMatches(forceRecompute: boolean = false): Promise<BatchMatchingResponse> {
    try {
      const response = await apiClient.post<BatchMatchingResponse>(
        '/matches/trigger-all',
        null,
        { params: { forceRecompute } }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to trigger all matches:', error);
      throw new Error(`Failed to trigger batch matching: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Checks the health status of the matching service.
   */
  async healthCheck(): Promise<MatchesHealthResponse> {
    try {
      const response = await apiClient.get<MatchesHealthResponse>('/matches/health');
      return response.data;
    } catch (error) {
      console.error('Failed to check matches service health:', error);
      throw new Error(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Waits for matching computation to complete by polling the results.
   * 
   * @param projectRequestId - The ID of the project request
   * @param maxAttempts - Maximum number of polling attempts
   * @param intervalMs - Polling interval in milliseconds
   */
  async waitForMatches(
    projectRequestId: number,
    maxAttempts: number = 30,
    intervalMs: number = 2000
  ): Promise<MatchTop10Response | null> {
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const matches = await this.getTopMatches(projectRequestId);
        if (matches && matches.matches.length > 0) {
          return matches;
        }
      } catch (_err) {
        console.debug(`Polling attempt ${attempt + 1} failed, continuing...`);
      }
      
      // Wait before next attempt
      await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
    
    return null;
  }

  /**
   * Triggers matching and waits for results.
   * Convenience method that combines trigger and wait operations.
   * 
   * @param projectRequestId - The ID of the project request
   * @param forceRecompute - Whether to recompute even if matches exist
   */
  async triggerAndWaitForMatches(
    projectRequestId: number,
    forceRecompute: boolean = false
  ): Promise<MatchTop10Response | null> {
    // Trigger matching
    await this.triggerMatching(projectRequestId, forceRecompute);
    
    // Wait for results
    return this.waitForMatches(projectRequestId);
  }
}

// Export a singleton instance
export const projectMatchesService = new ProjectMatchesService();