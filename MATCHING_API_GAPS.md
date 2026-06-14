# Matching API — frontend ↔ backend sync

Backend implements the safe matching flow. Frontend uses **primary** endpoints via `src/api/matchingApi.ts`.

## Primary endpoints (in use)

| Action | Endpoint |
|--------|----------|
| Persisted results (safe on load/expand) | `GET /project-requests/{id}/matches` |
| Preview (no LLM) | `GET /project-requests/{id}/matches/preview` |
| Explicit AI run | `POST /project-requests/{id}/matches/run` |
| Status | `GET /project-requests/{id}/matches/status` |
| Upload analyse | `POST /project-requests/upload?useHighestQualityModel=` |

## Legacy fallbacks (only when primary 404/405)

| Action | Fallback |
|--------|----------|
| Persisted results | `GET /matches/requests/{id}/top` |
| Status | `GET /matches/status/{requestId}` |
| AI run | `POST /matches/requests/{id}/re-analyze` (deprecated) |

## Not called automatically

- `GET /matches/requests/{id}/top-consultants` (deprecated; may trigger LLM on first access)

## Response shapes (backend contract)

- `GET /matches` → `MatchCandidateDto[]` (`score`, not `relevanceScore`)
- `GET /preview` → `ProjectMatchPreviewResponse` with `MatchPreviewCandidateDto[]` (`combinedScore`, `reason`)
- `GET /status` → `ProjectMatchStatusResponse` (`status`: `MatchingStatus` enum)

## Embedding status

`GET /consultants/search/embedding-info` exposes `activeEmbeddingCount`, `semanticSearchReady`, `totalConsultantCount`.
