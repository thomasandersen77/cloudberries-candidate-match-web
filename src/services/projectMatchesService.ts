import apiClient from './apiClient';
import type { MatchTop10Response } from '../types/api';

/**
 * The one read left of the older matching endpoints: a request's stored top ten, which
 * `matchingApi.getProjectMatchResults` falls back to when the newer results endpoint has nothing.
 *
 * This was a class with trigger, poll, batch and health calls, all serving `ProjectMatchingPage`,
 * a page no route ever pointed at. The page and the calls went together. The backend endpoints
 * stay, because clients outside this repository are unknown.
 */
export const projectMatchesService = {
  /** Null when the request has no stored run yet, which the endpoint reports as a 404. */
  async getTopMatches(projectRequestId: number): Promise<MatchTop10Response | null> {
    try {
      const response = await apiClient.get<MatchTop10Response>(`matches/requests/${projectRequestId}/top`);
      return response.data;
    } catch (error: unknown) {
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { status?: number } };
        if (axiosError.response?.status === 404) return null;
      }
      console.error(`Failed to get matches for project ${projectRequestId}:`, error);
      throw new Error(`Failed to fetch matches: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  },
};
