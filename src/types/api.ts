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

// CV with consultants
export type ConsultantWithCvDto = components['schemas']['ConsultantWithCvDto'];
export type PageConsultantWithCvDto = components['schemas']['PageConsultantWithCvDto'];
export type ConsultantCvDto = components['schemas']['ConsultantCvDto'];

// CV structure types
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

// Search types
export type RelationalSearchRequest = components['schemas']['RelationalSearchRequest'];
export type SemanticSearchRequest = components['schemas']['SemanticSearchRequest'];
export type ConsultantSearchResultDto = components['schemas']['ConsultantSearchResultDto'];
export type PageConsultantSearchResultDto = components['schemas']['PageConsultantSearchResultDto'];
export type Skill = components['schemas']['Skill'];
