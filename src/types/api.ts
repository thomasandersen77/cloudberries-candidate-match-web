// Re-eksporter typer generert fra OpenAPI for konsistens
import type { components, paths } from '../api/generated';

// --- OpenAPI schemas ---

export type AnthropicUsageResponse = {
  periodStart?: string;
  periodEnd?: string;
  totalRequests?: number;
  totalInputTokens?: number;
  totalOutputTokens?: number;
  estimatedCostUsd?: number;
};

export type HealthStatusValue = components['schemas']['HealthResponse']['status'];
export type HealthResponse = components['schemas']['HealthResponse'];

export type AIAnalysisRequest = components['schemas']['AIAnalysisRequest'];
export type AIResponseModel = components['schemas']['AIResponseModel'];

export type RagChatRequest = {
  message: string;
  topK?: number;
  similarityThreshold?: number;
  filter?: string | null;
};
export type SourceDocument = {
  id?: string;
  consultantId?: string;
  consultantName?: string;
  chunkId?: string;
  content?: string;
  score?: number;
  metadata?: Record<string, unknown>;
};
export type RagChatResponse = {
  answer?: string;
  sources?: SourceDocument[];
};
export type RagIngestRequest = {
  consultantId?: string;
  cvId?: string;
  force?: boolean;
};

export type ConsultantSummaryDto = components['schemas']['ConsultantSummaryDto'];
type OpenApiPageConsultantSummaryDto = components['schemas']['PageConsultantSummaryDto'];
export type PageConsultantSummaryDto = OpenApiPageConsultantSummaryDto & {
  first?: boolean;
  last?: boolean;
  sort?: Record<string, unknown>;
  pageable?: Record<string, unknown>;
};

export type CvData = paths['/cv/{userId}']['get']['responses'][200]['content']['application/json'];

export type EmbeddingRunMissingResponse =
  paths['/embeddings/run/missing']['post']['responses'][200]['content']['application/json'];
export type EmbeddingProviderInfo = components['schemas']['EmbeddingProviderInfo'] & {
  /** Legacy aliases used by search UI */
  provider?: string;
  model?: string;
};

export type CandidateDTO = components['schemas']['CandidateDTO'];
export type CvScoreDto = components['schemas']['CvScoreDto'];
export type CvScoringRunResponse = components['schemas']['CvScoringRunResponse'];
export type CvScoreAiProvider = 'ANTHROPIC' | 'OPENAI' | 'GOOGLE_GEMINI';

export type ProjectRequirementDto = components['schemas']['ProjectRequirementDto'];
type OpenApiProjectRequestResponseDto = components['schemas']['ProjectRequestResponseDto'];
export type ProjectRequestResponseDto = OpenApiProjectRequestResponseDto & {
  uploadedAt?: string;
  deadlineDate?: string;
};
export type ProjectRequestSummaryDto = components['schemas']['ProjectRequestSummaryDto'];

export type SkillInCompanyDto = components['schemas']['SkillInCompanyDto'] & {
  /** Legacy alias used by some UI code */
  consultantCount?: number;
};

export type ConsultantWithCvDto = components['schemas']['ConsultantWithCvDto'];
type OpenApiPageConsultantWithCvDto = components['schemas']['PageConsultantWithCvDto'];
export type PageConsultantWithCvDto = OpenApiPageConsultantWithCvDto & {
  first?: boolean;
  last?: boolean;
  sort?: Record<string, unknown>;
  pageable?: Record<string, unknown>;
};
export type ConsultantCvDto = components['schemas']['ConsultantCvDto'];

export type KeyQualificationDto = components['schemas']['KeyQualificationDto'];
export type EducationDto = components['schemas']['EducationDto'];
export type WorkExperienceDto = components['schemas']['WorkExperienceDto'];
export type ProjectExperienceDto = components['schemas']['ProjectExperienceDto'];
export type ProjectRoleDto = components['schemas']['ProjectRoleDto'];
export type CertificationDto = components['schemas']['CertificationDto'];
export type CourseDto = components['schemas']['CourseDto'];
export type LanguageDto = components['schemas']['LanguageDto'];
export type SkillCategoryDto = components['schemas']['SkillCategoryDto'];
export type SkillInCategoryDto = components['schemas']['SkillInCategoryDto'];
export type AttachmentDto = components['schemas']['AttachmentDto'];

export type RelationalSearchRequest = components['schemas']['RelationalSearchRequest'];
export type SemanticSearchRequest = components['schemas']['SemanticSearchRequest'];
export type PaginationDto = components['schemas']['PaginationDto'];

export type CoverageStatus = components['schemas']['CoverageStatus'];
export type MatchesListItemDto = components['schemas']['MatchesListItemDto'];
export type PagedMatchesListDto = components['schemas']['PagedMatchesListDto'];
export type MatchConsultantDto = components['schemas']['MatchConsultantDto'];
export type MatchStatusDto = {
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED' | string;
  lastUpdated?: string | null;
  error?: string | null;
};
export type TriggerMatchingResponse = components['schemas']['TriggerMatchingResponse'];
export type RecalculateMatchesResponse = {
  requestId?: number;
  status?: string;
  message?: string;
};

export type RagIngestResponse = {
  indexed?: number;
  skipped?: number;
  status?: string;
};
export type RagIngestDbResponse = {
  processed?: number;
  status?: string;
};

// --- Legacy types (endpoints not in current OpenAPI spec) ---

export type EmbeddingJasonRunResponse = { processedJason?: boolean };
export type EmbeddingUserCvRunResponse = { userId: string; cvId: string; processed: boolean };

export type MatchApiRequest = { projectRequestText: string };
export type SkillsRequest = { skills: string[] };
export type Requirement = { name: string; comment: string; score: string };
export type CandidateMatchResponse = {
  totalScore: string;
  summary: string;
  matchTimeSeconds?: number;
  requirements?: Requirement[];
};

export type PagedProjectRequestResponseDto = {
  content?: ProjectRequestResponseDto[];
  totalElements?: number;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
};

export type CreateProjectRequestDto = {
  customerName: string;
  requiredSkills: string[];
  startDate: string;
  endDate: string;
  responseDeadline: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  requestDescription: string;
  responsibleSalespersonEmail: string;
};

export type ProjectRequestDto = {
  id?: number;
  customerId?: number;
  customerName: string;
  requiredSkills: string[];
  startDate: string;
  endDate: string;
  responseDeadline: string;
  status: 'OPEN' | 'IN_PROGRESS' | 'CLOSED';
  requestDescription: string;
  responsibleSalespersonEmail: string;
  aiSuggestions?: AISuggestionDto[];
};

export type AISuggestionDto = {
  id?: number;
  consultantName: string;
  userId: string;
  cvId: string;
  matchScore: number;
  justification: string;
  createdAt: string;
  skills?: string[];
};

// Frontend-only types for skills summary endpoint (not in OpenAPI)
export type SkillSummaryDto = { name: string; consultantCount: number };
export type PageSkillSummaryDto = {
  content?: SkillSummaryDto[];
  number?: number;
  size?: number;
  totalElements?: number;
  totalPages?: number;
  first?: boolean;
  last?: boolean;
  sort?: Record<string, unknown>;
  pageable?: Record<string, unknown>;
};

// Legacy chatbot/search types (not in OpenAPI)
export type ChatSearchRequest = {
  conversationId?: string;
  consultantId?: string;
  cvId?: string;
  text: string;
  forceMode?: 'STRUCTURED' | 'SEMANTIC' | 'HYBRID' | 'RAG';
  topK?: number;
};

export type ChatSearchResponse = {
  mode: 'STRUCTURED' | 'SEMANTIC' | 'HYBRID' | 'RAG';
  results?: SearchResult[];
  answer?: string;
  sources?: RAGSource[];
  latencyMs: number;
  debug?: DebugInfo;
  conversationId?: string;
  scoring?: ScoringInfo;
};

export type SearchResult = {
  consultantId: string;
  name: string;
  score: number;
  highlights?: string[];
  meta?: Record<string, unknown>;
};

export type RAGSource = {
  consultantId: string;
  consultantName: string;
  chunkId: string;
  text: string;
  score: number;
  location?: string;
};

export type DebugInfo = {
  interpretation?: QueryInterpretation;
  timings?: Record<string, number>;
  extra?: Record<string, unknown>;
};

export type QueryInterpretation = {
  route?: 'STRUCTURED' | 'SEMANTIC' | 'HYBRID' | 'RAG';
  structured?: StructuredCriteria;
  structuredCriteria?: StructuredCriteria;
  semanticText?: string;
  consultantName?: string;
  question?: string;
  confidence?: ConfidenceScores;
  rawQuery?: string;
};

export type StructuredCriteria = {
  skillsAll?: string[];
  skillsAny?: string[];
  roles?: string[];
  industries?: string[];
};

export type ConfidenceScores = {
  overall?: number;
  skills?: number;
  roles?: number;
};

export type ScoringInfo = {
  method?: string;
  weights?: Record<string, number>;
  details?: Record<string, unknown>;
  semanticWeight?: number;
  qualityWeight?: number;
  formula?: string;
};
