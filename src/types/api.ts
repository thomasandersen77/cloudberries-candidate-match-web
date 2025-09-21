// Types derived from openapi.yaml

export type HealthStatusValue = 'UP' | 'DOWN' | 'OUT_OF_SERVICE' | 'UNKNOWN';

export interface HealthResponse {
  status: HealthStatusValue;
  details?: Record<string, string>;
}

export interface AIAnalysisRequest { content: string }
export interface AIResponseModel { content?: string; modelUsed?: string }

export interface ConsultantSummaryDto {
  userId: string;
  name: string;
  email: string;
  bornYear: number;
  defaultCvId: string;
}

export interface PageConsultantSummaryDto {
  content: ConsultantSummaryDto[];
  number: number;
  size: number;
  totalElements: number;
  totalPages: number;
  first: boolean;
  last: boolean;
  sort?: Record<string, unknown>;
  pageable?: Record<string, unknown>;
}

export type CvData = Record<string, unknown>;

export interface EmbeddingJasonRunResponse { processedJason?: boolean }
export interface EmbeddingUserCvRunResponse { userId: string; cvId: string; processed: boolean }
export interface EmbeddingRunMissingResponse { processedCount?: number; batchSize?: number }

export interface MatchApiRequest { projectRequestText: string }
export interface SkillsRequest { skills: string[] }

export interface Requirement { name: string; comment: string; score: string }
export interface CandidateMatchResponse {
  totalScore: string;
  summary: string;
  matchTimeSeconds?: number;
  requirements?: Requirement[];
}

export interface CandidateDTO { id: string; name: string; birthYear: number }

export interface CvScoreDto {
  candidateId: string;
  scorePercent: number;
  summary: string;
  strengths: string[];
  potentialImprovements: string[];
}