---
name: sync-openapi-api-client
description: Synkroniserer openapi.yaml med frontend API-klienten (genererte typer og service-lag). Sørg for at det følgende fillet er implementert i API-klienten, slik at den kan kommunisere med backend. Bruk når openapi.yaml endres, nye endepunkter legges til, API-klienten skal oppdateres, eller brukeren ber om backend-kommunikasjon via OpenAPI.
---

# Synkroniser OpenAPI med API-klient

Sørg for at det følgende fillet er implementert i API-klienten, slik at den kan kommunisere med backend.

**Kilde:** [openapi.yaml](../../../openapi.yaml) (rot i repo)

## Arkitektur

```
openapi.yaml
    ↓ npm run gen:api
src/api/generated.ts          ← auto-generert, ikke rediger manuelt
    ↓ re-eksporter
src/types/api.ts              ← named exports for app-kode
    ↓ brukes av
src/services/*Service.ts      ← axios-kall via apiClient
    ↓
React pages / hooks
```

## Workflow

Kopier og følg denne sjekklisten:

```
- [ ] 1. Les openapi.yaml – paths, metoder, request/response schemas
- [ ] 2. Kjør npm run gen:api
- [ ] 3. Oppdater src/types/api.ts for nye/endrede schemas
- [ ] 4. Implementer/oppdater service-funksjoner
- [ ] 5. Verifiser dekning (spec ↔ klient)
- [ ] 6. Kjør npm run build og relevante tester
```

### Steg 1: Kartlegg endepunkter

Grupper etter OpenAPI-tag og tilhørende service-fil:

| Tag | Service-fil |
|-----|-------------|
| Admin | `src/services/adminService.ts` (opprett ved behov) |
| Chat | `src/services/chatService.ts` |
| Skills | `src/services/skillsService.ts` |
| Consultants | `src/services/consultantsService.ts` |
| CV | `src/services/cvService.ts` |
| Embeddings | `src/services/embeddingsService.ts` |
| Health | `src/services/healthService.ts` |
| Matches | `src/services/matchesRequestsService.ts`, `newMatchesService.ts`, `projectMatchesService.ts` |
| CV Scoring | `src/services/cvScoreService.ts` |

Se [reference.md](reference.md) for full path→service mapping.

### Steg 2: Regenerer typer

```bash
npm run gen:api
```

Dette oppdaterer `src/api/generated.ts` fra `openapi.yaml`.

### Steg 3: Oppdater type-re-eksporter

Legg til eller oppdater exports i `src/types/api.ts`:

```typescript
import type { components } from '../api/generated';

export type ExampleDto = components['schemas']['ExampleDto'];
```

- Bruk `components['schemas'][...]` for DTO-er
- Bruk `components['responses'][...]` kun ved behov
- Fjern manuelle typer som nå finnes i OpenAPI
- Behold frontend-only typer kun når endepunktet **ikke** finnes i spec (merk med kommentar)

### Steg 4: Implementer service-funksjoner

Følg eksisterende mønster:

```typescript
import apiClient, { aiScoringClient } from './apiClient';
import type { SomeRequest, SomeResponse } from '../types/api';

export async function doSomething(payload: SomeRequest): Promise<SomeResponse> {
  const { data } = await apiClient.post<SomeResponse>('path/without/leading/slash', payload);
  return data;
}
```

**Konvensjoner:**

| Regel | Detalj |
|-------|--------|
| HTTP-klient | `apiClient` (default). `aiScoringClient` for AI/scoring/sync som kan ta minutter |
| URL | Relativ sti uten ledende `/` – f.eks. `'consultants'`, `'rag/chat'` |
| Path-parametre | `encodeURIComponent(userId)` |
| Query-parametre | Axios `params`-objekt; arrays via `style: form, explode: true` i spec |
| Typer | Importer fra `../types/api`, ikke direkte fra `generated.ts` |
| Multipart | `FormData` + `{ headers: { 'Content-Type': 'multipart/form-data' } }` |
| Navngiving | Verb + entitet: `listConsultants`, `getCv`, `runConsultantSync` |

**Eksempel – GET med query:**

```typescript
export async function listConsultants(params: { name?: string; page?: number; size?: number; sort?: string[] } = {}) {
  const { data } = await apiClient.get<PageConsultantSummaryDto>('consultants', { params });
  return data;
}
```

**Eksempel – POST med path-param:**

```typescript
export async function getCv(userId: string): Promise<CvData> {
  const { data } = await apiClient.get<CvData>(`cv/${encodeURIComponent(userId)}`);
  return data;
}
```

### Steg 5: Verifiser dekning

1. **Spec → klient:** Hvert `paths`-endepunkt i `openapi.yaml` skal ha minst én tilsvarende service-funksjon
2. **Klient → spec:** Service-kall som ikke finnes i spec skal flagges (legacy eller manglende spec-oppdatering)
3. Sammenlign `grep` på paths i spec mot `apiClient.get/post/put/delete` i `src/services/`

```bash
# Endepunkter i spec
grep -E '^\s+/[a-z]' openapi.yaml

# Kall i services
rg "apiClient\.(get|post|put|delete|patch)|aiScoringClient\.(get|post)" src/services/
```

Rapporter mangler som tabell:

| Endepunkt | Metode | Status | Service |
|-----------|--------|--------|---------|
| `/rag/chat` | POST | mangler | chatService.ts |

### Steg 6: Verifiser bygg

```bash
npm run build
npm test -- --run src/services/
```

Fiks TypeScript-feil fra schema-endringer før ferdig.

## Vanlige gap (per nåværende spec v1.2.0)

Disse endepunktene finnes i `openapi.yaml` men kan mangle service-implementasjon – sjekk alltid:

- `/admin/anthropic-usage`
- `/rag/chat`, `/rag/ingest`, `/rag/ingest/db`
- `/matches/requests`, `/matches/requests/{id}/re-analyze`, `/matches/requests/{projectRequestId}/trigger`
- `/matches/status/{requestId}`, `/matches/recalculate/{requestId}`, `/matches/trigger-all`

Legacy service-kall **uten** spec-støtte (flagg, ikke slett uten avklaring):

- `chatbot/search`, `skills/summary`, `skills/{skill}/consultants`, `project-requests/*` (unntatt upload)
- `matches`, `matches/by-skills`, `embeddings/run/jason`

## Output-format

Når oppgaven er fullført, oppsummer:

1. **Endringer** – hvilke filer ble oppdatert
2. **Dekning** – antall spec-endepunkter implementert vs. manglende
3. **Avvik** – klient-kall uten spec eller spec uten klient
4. **Verifisering** – resultat av `npm run build` / tester

## Additional resources

- Full path→service mapping: [reference.md](reference.md)
