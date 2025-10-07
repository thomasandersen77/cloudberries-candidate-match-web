import type { ScoreLevel, ScoreVisualization } from '../types/matches';

/**
 * Utility functions for working with consultant match scores and visualization.
 */

/**
 * Determines the score level based on the match score value.
 * 
 * @param score - Match score between 0 and 1
 * @returns Score level classification
 */
export function getScoreLevel(score: number): ScoreLevel {
  if (score >= 0.8) return 'high';
  if (score >= 0.6) return 'medium';
  return 'low';
}

/**
 * Gets visualization properties for a given score level.
 * 
 * @param level - The score level
 * @returns Visualization properties including colors and description
 */
export function getScoreVisualization(level: ScoreLevel): ScoreVisualization {
  switch (level) {
    case 'high':
      return {
        level: 'high',
        color: '#059669', // emerald-600
        backgroundColor: '#d1fae5', // emerald-100
        description: 'Excellent match'
      };
    case 'medium':
      return {
        level: 'medium',
        color: '#d97706', // amber-600
        backgroundColor: '#fef3c7', // amber-100
        description: 'Good match'
      };
    case 'low':
      return {
        level: 'low',
        color: '#dc2626', // red-600
        backgroundColor: '#fee2e2', // red-100
        description: 'Fair match'
      };
  }
}

/**
 * Gets visualization properties directly from a score value.
 * 
 * @param score - Match score between 0 and 1
 * @returns Visualization properties
 */
export function getScoreVisualizationFromScore(score: number): ScoreVisualization {
  const level = getScoreLevel(score);
  return getScoreVisualization(level);
}

/**
 * Formats a match score as a percentage string.
 * 
 * @param score - Match score between 0 and 1
 * @param decimals - Number of decimal places to show
 * @returns Formatted percentage string
 */
export function formatScoreAsPercentage(score: number, decimals: number = 1): string {
  return `${(score * 100).toFixed(decimals)}%`;
}

/**
 * Formats a match score as a decimal string.
 * 
 * @param score - Match score between 0 and 1
 * @param decimals - Number of decimal places to show
 * @returns Formatted decimal string
 */
export function formatScoreAsDecimal(score: number, decimals: number = 3): string {
  return score.toFixed(decimals);
}

/**
 * Sorts match candidates by score in descending order.
 * 
 * @param candidates - Array of match candidates
 * @returns Sorted array of candidates
 */
export function sortCandidatesByScore<T extends { matchScore: number }>(candidates: T[]): T[] {
  return [...candidates].sort((a, b) => b.matchScore - a.matchScore);
}

/**
 * Filters candidates by minimum score threshold.
 * 
 * @param candidates - Array of match candidates
 * @param minScore - Minimum score threshold
 * @returns Filtered array of candidates
 */
export function filterCandidatesByMinScore<T extends { matchScore: number }>(
  candidates: T[], 
  minScore: number
): T[] {
  return candidates.filter(candidate => candidate.matchScore >= minScore);
}

/**
 * Gets the top N candidates by score.
 * 
 * @param candidates - Array of match candidates
 * @param limit - Maximum number of candidates to return
 * @returns Array of top candidates
 */
export function getTopCandidates<T extends { matchScore: number }>(candidates: T[], limit: number): T[] {
  return sortCandidatesByScore(candidates).slice(0, limit);
}

/**
 * Calculates basic statistics for an array of scores.
 * 
 * @param scores - Array of scores
 * @returns Statistics object
 */
export function calculateScoreStatistics(scores: number[]) {
  if (scores.length === 0) {
    return { min: 0, max: 0, average: 0, count: 0 };
  }

  const min = Math.min(...scores);
  const max = Math.max(...scores);
  const sum = scores.reduce((acc, score) => acc + score, 0);
  const average = sum / scores.length;

  return {
    min,
    max,
    average,
    count: scores.length
  };
}

/**
 * Truncates explanation text to a maximum length with ellipsis.
 * 
 * @param explanation - The explanation text
 * @param maxLength - Maximum length before truncation
 * @returns Truncated text with ellipsis if needed
 */
export function truncateExplanation(explanation?: string, maxLength: number = 150): string {
  if (!explanation) return 'No explanation provided';
  
  if (explanation.length <= maxLength) {
    return explanation;
  }
  
  return explanation.substring(0, maxLength).trim() + '...';
}

/**
 * Formats a date string for display in the UI.
 * 
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export function formatMatchDate(dateString: string): string {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'Unknown date';
  }
}

/**
 * Formats a relative time string (e.g., "2 hours ago").
 * 
 * @param dateString - ISO date string
 * @returns Relative time string
 */
export function formatRelativeTime(dateString: string): string {
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    
    return formatMatchDate(dateString);
  } catch {
    return 'Unknown time';
  }
}