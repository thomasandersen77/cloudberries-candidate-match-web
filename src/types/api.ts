// Re-eksporter typer generert fra OpenAPI for konsistens
import type { components } from '../api/generated';

export type HealthStatusValue = components['schemas']['HealthResponse']['status'];
export type HealthResponse = components['schemas']['HealthResponse'];

export type AIAnalysisRequest = components['schemas']['AIAnalysisRequest'];
export type AIResponseModel = components['schemas']['AIResponseModel'];

export type ConsultantSummaryDto = components['schemas']['ConsultantSummaryDto'];
export type PageConsultantSummaryDto = components['schemas']['PageConsultantSummaryDto'];

export type CvData = components['schemas']['CvData'];

export type EmbeddingJasonRunResponse = components['schemas']['EmbeddingJasonRunResponse'];
export type EmbeddingUserCvRunResponse = components['schemas']['EmbeddingUserCvRunResponse'];
export type EmbeddingRunMissingResponse = components['schemas']['EmbeddingRunMissingResponse'];

export type MatchApiRequest = components['schemas']['MatchApiRequest'];
export type SkillsRequest = components['schemas']['SkillsRequest'];

export type Requirement = components['schemas']['Requirement'];
export type CandidateMatchResponse = components['schemas']['CandidateMatchResponse'];

export type CandidateDTO = components['schemas']['CandidateDTO'];

export type CvScoreDto = components['schemas']['CvScoreDto'];

// Project Request typer
export type ProjectRequirementDto = components['schemas']['ProjectRequirementDto'];
export type ProjectRequestResponseDto = components['schemas']['ProjectRequestResponseDto'];

// Skills aggregate
export type SkillInCompanyDto = components['schemas']['SkillInCompanyDto'];
  customerName?: string;
  title?: string;
  summary?: string;
  originalFilename?: string;
  mustRequirements?: ProjectRequirementDto[];
  shouldRequirements?: ProjectRequirementDto[];
}
