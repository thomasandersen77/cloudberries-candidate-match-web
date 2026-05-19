# OpenAPI path → service mapping

Kilde: `openapi.yaml` v1.2.0. Oppdater ved spec-endringer.

## Admin

| Path | Method | Service | Funksjon (foreslått) |
|------|--------|---------|----------------------|
| `/admin/anthropic-usage` | GET | `adminService.ts` | `getAnthropicUsage()` |

## Chat

| Path | Method | Service | Funksjon |
|------|--------|---------|----------|
| `/chatbot/analyze` | POST | `chatService.ts` | `analyzeContent()` |
| `/rag/chat` | POST | `chatService.ts` | `ragChat()` |
| `/rag/ingest` | POST | `chatService.ts` | `ragIngest()` |
| `/rag/ingest/db` | POST | `chatService.ts` | `ragIngestFromDb()` |

## Consultants

| Path | Method | Service | Funksjon |
|------|--------|---------|----------|
| `/consultants` | GET | `consultantsService.ts` | `listConsultants()` |
| `/consultants/with-cv` | GET | `consultantsService.ts` | `listConsultantsWithCv()` |
| `/consultants/with-cv/paged` | GET | `consultantsService.ts` | `listConsultantsWithCvPaged()` |
| `/consultants/{userId}/cvs` | GET | `consultantsService.ts` | `listConsultantCvs()` |
| `/consultants/search` | POST | `consultantsService.ts` | `searchConsultantsRelational()` |
| `/consultants/search/semantic` | POST | `consultantsService.ts` | `searchConsultantsSemantic()` |
| `/consultants/search/embedding-info` | GET | `consultantsService.ts` | `getEmbeddingInfo()` |
| `/consultants/sync/run` | POST | `consultantsService.ts` | `runConsultantSync()` |

## CV

| Path | Method | Service | Funksjon |
|------|--------|---------|----------|
| `/cv/{userId}` | GET | `cvService.ts` | `getCv()` |

## Embeddings

| Path | Method | Service | Funksjon |
|------|--------|---------|----------|
| `/embeddings/run/missing` | POST | `embeddingsService.ts` | `runMissing()` |

## Health

| Path | Method | Service | Funksjon |
|------|--------|---------|----------|
| `/health` | GET | `healthService.ts` | `getHealth()` / `getHealthStatus()` |

## Matches

| Path | Method | Service | Funksjon (foreslått) |
|------|--------|---------|----------------------|
| `/matches/requests` | GET | `matchesRequestsService.ts` | `listMatchRequestsSimple()` |
| `/matches/requests-paged` | GET | `matchesRequestsService.ts` | `listMatchRequests()` |
| `/matches/requests/{id}/top-consultants` | GET | `matchesRequestsService.ts` | `getTopConsultantsForRequest()` |
| `/matches/requests/{id}/re-analyze` | POST | `newMatchesService.ts` | `reAnalyzeRequest()` |
| `/matches/requests/{projectRequestId}/trigger` | POST | `projectMatchesService.ts` | `triggerMatching()` |
| `/matches/status/{requestId}` | GET | `newMatchesService.ts` | `getMatchStatus()` |
| `/matches/recalculate/{requestId}` | POST | `newMatchesService.ts` | `recalculateMatch()` |
| `/matches/trigger-all` | POST | `newMatchesService.ts` | `triggerAllMatches()` |

## Project requests

| Path | Method | Service | Funksjon |
|------|--------|---------|----------|
| `/project-requests/upload` | POST | `projectRequestsService.ts` | `uploadProjectRequest()` |

## CV Scoring

| Path | Method | Service | Funksjon |
|------|--------|---------|----------|
| `/cv-score/{candidateId}` | GET | `cvScoreService.ts` | `getCvScore()` |
| `/cv-score/all` | GET | `cvScoreService.ts` | `getAllCandidates()` |
| `/cv-score/run/all` | POST | `cvScoreService.ts` | `runScoreForAll()` |

## Skills

| Path | Method | Service | Funksjon |
|------|--------|---------|----------|
| `/skills` | GET | `skillsService.ts` | `listSkills()` |

## Schemas → types/api.ts

Vanlige schemas fra spec (ikke uttømmende – sjekk `components/schemas` i openapi.yaml):

- `AnthropicUsageResponse`, `AIAnalysisRequest`, `AIResponseModel`
- `RagChatRequest`, `RagChatResponse`, `RagIngestRequest`, `SourceDocument`
- `ConsultantSummaryDto`, `PageConsultantSummaryDto`, `ConsultantWithCvDto`, `PageConsultantWithCvDto`
- `RelationalSearchRequest`, `SemanticSearchRequest`, `EmbeddingProviderInfo`
- `CvData`, `HealthResponse`
- `PagedMatchesListDto`, `MatchesListItemDto`, `MatchConsultantDto`, `MatchStatusDto`, `TriggerMatchingResponse`
- `ProjectRequestResponseDto`, `CvScoreDto`, `CandidateDTO`, `CvScoringRunResponse`
- `SkillInCompanyDto`, `Problem`

## Axios-klienter

| Klient | Fil | Bruk |
|--------|-----|------|
| `apiClient` | `src/services/apiClient.ts` | Standard REST-kall (180s timeout) |
| `aiScoringClient` | `src/services/apiClient.ts` | AI, scoring, sync (600s timeout) |
| `analyticsClient` | `src/services/apiClient.ts` | Analytics (egen base URL via `VITE_ANALYTICS_BASE_URL`) |

Base URL settes via `VITE_API_BASE_URL` (default `/` med Vite proxy i dev).
