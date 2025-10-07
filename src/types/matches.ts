// Types for the matches functionality
// These extend the OpenAPI generated types with specific UI types

export interface ProjectRequestSummary {
  id: number;
  title: string;
  customerName: string;
  createdAt: string;
}

export interface MatchCandidate {
  consultantId: number;
  consultantName: string;
  userId: string;
  cvId?: string;
  matchScore: number;
  matchExplanation?: string;
  createdAt: string;
}

export interface MatchTop10Response {
  projectRequestId: number;
  projectTitle?: string;
  totalMatches: number;
  matches: MatchCandidate[];
  lastUpdated?: string;
}

export interface TriggerMatchingRequest {
  forceRecompute?: boolean;
}

export interface TriggerMatchingResponse {
  projectRequestId: number;
  status: string;
  message: string;
  jobId?: string;
}

export interface MatchesHealthResponse {
  status: string;
  service: string;
  projectRequestsCount: number;
  timestamp: number;
}

export interface BatchMatchingResponse {
  status: string;
  message: string;
  projectCount: number;
  jobId: string;
  forceRecompute: boolean;
  timestamp: number;
}

// UI state types
export interface MatchesPageState {
  projectRequests: ProjectRequestSummary[];
  expandedProjectId: number | null;
  matches: Record<number, MatchCandidate[]>;
  loading: Record<number, boolean>;
  error: string | null;
}

export interface ProjectCardProps {
  project: ProjectRequestSummary;
  isExpanded: boolean;
  matches?: MatchCandidate[];
  loading?: boolean;
  onToggleExpand: (projectId: number) => void;
  onTriggerMatching: (projectId: number, forceRecompute?: boolean) => void;
}

export interface MatchResultsTableProps {
  matches: MatchCandidate[];
  loading?: boolean;
}

// Score visualization types
export type ScoreLevel = 'high' | 'medium' | 'low';

export interface ScoreVisualization {
  level: ScoreLevel;
  color: string;
  backgroundColor: string;
  description: string;
}

// Match status types
export type MatchingStatus = 'idle' | 'loading' | 'success' | 'error';

export interface MatchingJobStatus {
  projectId: number;
  status: MatchingStatus;
  jobId?: string;
  error?: string;
  lastUpdated?: string;
}