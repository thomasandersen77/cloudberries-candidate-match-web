# API gaps for project request details

This file documents the mismatch between frontend expectations and current backend responses for project requests.

## Current observed response (`GET /api/project-requests/{id}`)

Backend currently returns a **legacy shape** like:

- `customerName`
- `requiredSkills[]` (mixed "må"/"bør" sentences)
- `startDate`
- `responseDeadline`
- `requestDescription`
- `status`
- `aiSuggestions`

Missing or empty in practice:

- `title`
- `summary`
- `mustRequirements[]`
- `shouldRequirements[]`
- explicit analysis timestamp (`uploadedAt` or `analyzedAt`)

## Frontend needs (target contract)

For a robust details UI, backend should return this shape consistently:

```json
{
  "id": 1,
  "customerName": "Oslo kommune, Utviklings- og kompetanseetaten",
  "title": "KI-utvikler til modernisering av tjenester",
  "summary": "Kort AI-oppsummering av behovet...",
  "originalFilename": "request.pdf",
  "uploadedAt": "2026-05-27T12:34:56Z",
  "deadlineDate": "2026-06-02",
  "mustRequirements": [
    { "name": "Kompetanse innen KI-systemutvikling", "details": "..." }
  ],
  "shouldRequirements": [
    { "name": "Erfaring med utviklingsmetodikk", "details": "..." }
  ],
  "status": "OPEN"
}
```

## Backend changes requested

1. Ensure `GET /project-requests/{id}` returns:
   - non-empty `title`
   - `summary`
   - `mustRequirements[]`
   - `shouldRequirements[]`
   - `uploadedAt` (or `analyzedAt`)
   - `deadlineDate`
2. Ensure `GET /project-requests` (paged list) returns the same core fields per item where possible.
3. Keep legacy fields temporarily if needed, but provide the normalized fields above.

## OpenAPI updates requested

Current `openapi.yaml` only documents `POST /project-requests/upload` for this area.

Please add/align:

- `GET /project-requests`
- `GET /project-requests/{id}`
- `POST /project-requests/{id}/analyze` (if used)
- `GET /project-requests/{id}/suggestions` (if used)
- `PUT /project-requests/{id}/close` (if used)

And make schemas explicit for:

- `ProjectRequestResponseDto` (normalized details shape)
- `ProjectRequirementDto` (for must/should)
- optional `ProjectRequestListItemDto` if list payload differs from detail payload

## Temporary frontend fallback (already implemented)

Frontend currently maps legacy response into the new UI by:

- deriving `title` from `requestDescription` when missing
- using `requestDescription` as `summary` fallback
- splitting `requiredSkills` into must/should using `må` vs `bør` heuristics
- mapping `startDate` to displayed analysis timestamp when `uploadedAt` is absent
- mapping `responseDeadline` to `deadlineDate`

This fallback should be removed once backend contract is normalized.
