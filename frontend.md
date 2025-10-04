# Frontend guide: Conversation history and Analytics page

This guide explains how to:
- Maintain multi-turn chat conversation context using a persistent session UUID
- Show company analytics for programming languages and roles on a new Stats page
- Keep API types in sync with backend OpenAPI

## 1) Conversation history (conversationId)

Backend now supports an optional `conversationId` on `POST /api/chatbot/analyze`.
Provide a stable session UUID from the browser so AI answers can reference the last ~8 turns.

Implementation
- Storage: `localStorage` key `cb_chat_conversation_id`
- Generation: `crypto.randomUUID()` when missing
- Usage: Include `conversationId` in the payload for `/api/chatbot/analyze`

Example (already applied)
```ts path=null start=null
// src/services/chatService.ts
function getOrCreateConversationId(): string {
  const key = 'cb_chat_conversation_id';
  let id = localStorage.getItem(key);
  if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
  return id;
}

export async function analyzeContent(payload: AIAnalysisRequest): Promise<AIResponseModel> {
  const body = { ...payload, conversationId: getOrCreateConversationId() };
  const { data } = await apiClient.post<AIResponseModel>('/api/chatbot/analyze', body);
  return data;
}
```

## 2) Analytics page (/stats)

Endpoints
- `GET /api/analytics/programming-languages`
  - Returns: `[ { language, consultantCount, percentage, aggregatedYears } ]`
- `GET /api/analytics/roles`
  - Returns: `[ { role, consultantCount, percentage } ]`

UI
- New route `/stats` that shows two tables:
  - Languages: Language, Number of consultants, Percentage, Aggregated years
  - Roles: Role, Number of consultants, Percentage
- Navigation updates:
  - Added "Statistikk" item in the header menu
  - Added a tile on the HomePage

Implementation (already applied)
- `src/pages/Analytics/StatsPage.tsx` renders two tables
- `src/services/analyticsService.ts` calls backend endpoints
- `src/App.tsx` adds a route for `/stats`
- `src/components/Header.tsx` and `src/pages/HomePage.tsx` include links

## 3) OpenAPI and types

- The backend OpenAPI (`candidate-match/openapi.yaml`) has been updated with:
  - `Analytics` tag and two paths (`/api/analytics/programming-languages`, `/api/analytics/roles`)
  - `conversationId` in `AIAnalysisRequest`
- The frontend `openapi.yaml` is updated accordingly.
- If you regenerate API types, make sure your generator uses the latest `openapi.yaml`.

Suggested codegen step (optional):
```bash path=null start=null
# Example using openapi-typescript (adjust as needed)
npx openapi-typescript openapi.yaml -o src/api/generated.ts
```

## 4) Local run

- Backend: `mvn -pl candidate-match spring-boot:run -Dspring-boot.run.profiles=local`
- Frontend: `npm run dev`
- Ensure DB on 5433 is up (docker-compose described in backend README)

## 5) Notes and future improvements
- Consider exposing filters for the languages list on the Stats page.
- Role synonyms are heuristic; refine the mapping if additional role labels are common.
- Conversation history currently keeps the last ~8 turns, truncating messages at ~4000 chars for safety.
