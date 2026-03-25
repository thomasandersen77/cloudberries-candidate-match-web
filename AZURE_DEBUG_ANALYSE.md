# Analyse: Frontend kommuniserer ikke med backend i Azure

## Symptom
Frontend på Azure Static Web Apps (SWA) kaller `/api/*`, men backend svarer ikke som forventet.

---

## Rot-årsaker (rangert etter sannsynlighet)

### 1. KRITISK – Ugyldig `rewrite`-URL i `staticwebapp.config.json`

**Fil**: `public/staticwebapp.config.json` (kopieres til `build/` av Vite)

**Nåværende innhold:**
```json
{
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["anonymous"],
      "rewrite": "https://cloudberries-candidate-match-ca.whitesand-767916af.westeurope.azurecontainerapps.io/api/{*}"
    }
  ],
  ...
}
```

**Problemet:**
- Azure SWA støtter **ikke** direkte rewrite til ekstern URL i `staticwebapp.config.json`
- `{*}` uten navn er ugyldig wildcard-syntaks i SWA (støttet: `{*path}` eller `/*`)
- Dette bekreftes av åpen PR "#8 – fix(swa): replace unsupported '{*path}' wildcard with..."
- Git-historikk viser at commit `bff6186` retttet dette: *"app is linked to the container and SWA will forward /api/x to /x for a linked backend"*, men det ble rullet tilbake igjen i etterfølgende commits.

**Slik fungerer SWA linked backend faktisk:**
Når Container App er koblet som API-backend (slik det er i Azure Portal → APIs-fanen), håndterer SWA proxying automatisk:
- Kall til `https://swa-domain.net/api/consultants`
- Videresendes til `https://containerapp.azurecontainerapps.io/consultants` (**`/api`-prefikset strippes**)
- Ingen `rewrite`-felt i konfigurasjonen er nødvendig

**Korrekt konfigurasjon:**
```json
{
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["anonymous"]
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/api/*", "/assets/*"]
  }
}
```

---

### 2. VIKTIG – Path-mismatch mellom frontend og backend

**Scenario A – backend har kontekststi `/api`:**
Hvis backend er konfigurert med `spring.mvc.servlet.path=/api` (eller `server.servlet.context-path=/api`):
- Frontend kaller: `/api/consultants`
- SWA stripper `/api` → sender `/consultants` til backend
- Backend forventer `/api/consultants` → **404**

**Scenario B – backend har ikke kontekststi:**
- Frontend kaller: `/api/consultants`
- SWA stripper `/api` → sender `/consultants` til backend
- Backend eksponer `/consultants` → **fungerer ✓**

Sjekk hvilken kontekststi backend faktisk bruker.

---

### 3. `swa-cli.config.json` – outputLocation mismatch

```json
"outputLocation": "dist"   // ← feil, Vite bygger til 'build/'
```

Dette er ikke en produksjonsfeil, men gjør lokal SWA CLI-testing upålitelig og kan skjule problemer.

---

## Hva portalskjermbildene avslører

Fra screenshot 2 (Static Web App → APIs):
- **Production**: Backend Type = Container App → `cloudberries-candidate-match-ca` ✓ (koblet korrekt)
- **Preview environments**: Viser PR "#8 – fix(swa): replace unsupported '{*path}' wildcard with..." – dette er en åpen fix som ikke er merget til `main` ennå.

---

## Anbefalt fix

**1. Oppdater `public/staticwebapp.config.json`:**
```json
{
  "routes": [
    {
      "route": "/api/*",
      "allowedRoles": ["anonymous"]
    }
  ],
  "navigationFallback": {
    "rewrite": "/index.html",
    "exclude": ["/api/*", "/assets/*"]
  }
}
```

**2. Verifiser backend context path:**
```bash
# Test direkte mot backend:
curl https://cloudberries-candidate-match-ca.whitesand-767916af.westeurope.azurecontainerapps.io/actuator/health
curl https://cloudberries-candidate-match-ca.whitesand-767916af.westeurope.azurecontainerapps.io/api/consultants

# Test gjennom SWA:
curl https://delightful-meadow-056d48003.1.azurestaticapps.net/api/consultants
```

**3. Oppdater `swa-cli.config.json`:**
```json
"outputLocation": "build"
```

---

## Relevante filer vedlagt i zip

| Fil | Formål |
|-----|--------|
| `public/staticwebapp.config.json` | SWA-ruting – **problemfilen** |
| `vite.config.ts` | Vite proxy-konfig (lokal utvikling) |
| `.env.production` | Produksjonsmiljøvariabler |
| `.env.development` | Lokalt utviklingsmiljø |
| `swa-cli.config.json` | SWA CLI lokal testing |
| `package.json` | Avhengigheter og build-scripts |
| `src/services/apiClient.ts` | Axios API-klient |
| `.github/workflows/azure-static-web-apps-delightful-meadow-056d48003.yml` | CI/CD-workflow |
| `DEPLOYMENT-SWA.md` | Deployment-dokumentasjon |

---

## Git-historikk (relevante commits)

```
bff6186  chore: update staticwebapp.config.json – NOT rewrite route (linked backend strips /api automatically)
ac1f7fd  Changed route pattern from /api/{*path} to /api/* (standard SWA wildcard)
5a3de63  fix(swa): add backward-compatibility rewrites for /api/*
```

Problemet har vært kjent og forsøkt fikset flere ganger, men konfigurasjonen har blitt rullet tilbake til feil tilstand.
