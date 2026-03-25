# Styling Archive - Innhold

**Fil:** `styling-archive.zip`  
**Størrelse:** 122 KB  
**Dato opprettet:** 21. november 2025

## Formål
Denne zip-filen inneholder alle kildekodefiler og konfigurasjon relatert til styling og utseende for cloudberries-candidate-match-web prosjektet. Den er laget for opplasting til Atlas for å generere styling-retningslinjer.

## Innhold

### CSS og Styling
- `src/App.css` - Hovedapplikasjonens CSS
- `src/index.css` - Global CSS med Tailwind imports
- `src/styles/brand.css` - Merkevare-spesifikke stiler

### Komponenter (`src/components/`)
Alle React-komponenter med inline styling og Tailwind-klasser:
- `ScoringOverlay.tsx` - Poeng-visning overlay
- `HealthCheckIndicator.tsx` - Helsestatus indikator
- `CvScoreBadge.tsx` - CV-score merke
- `Header.tsx` - Applikasjonshode
- `WordCloud.tsx` - Ordsky-visualisering
- `CV/*` - CV-relaterte komponenter
- `Sync/*` - Synkroniseringskomponenter
- `analytics/*` - Analytikk-komponenter
- `matches/*` - Match-komponenter
- `feedback/*` - Tilbakemeldings-komponenter

### Sider (`src/pages/`)
Alle applikasjonssider med layout og styling:
- `Chat/*` - Chat-grensesnitt med RAG
- `CvScore/*` - CV-poeng-side
- `Embeddings/*` - Embeddings-visualisering
- `Health/*` - Helsestatus-side
- `Matches/*` - Match-oversikt
- `Search/*` - Søkegrensesnitt
- `Consultants/*` - Konsulentliste
- `CV/*` - CV-visning
- `Skills/*` - Kompetanse-oversikt
- `ProjectRequests/*` - Prosjektforespørsler
- `Analytics/*` - Statistikk og analyser
- `HomePage.tsx` - Hjemmeside

### Routes (`src/routes/`)
- `AppLayout.tsx` - Hovedlayout med navigasjon
- `router.tsx` - React Router konfigurasjon

### App Entry
- `src/App.tsx` - Hovedapplikasjon
- `src/main.tsx` - Entry point

### Konfigurasjon
- `package.json` - Dependencies (inkl. Tailwind CSS, React, etc.)
- `vite.config.ts` - Vite build-konfigurasjon
- `tsconfig.json` - TypeScript konfigurasjon (root)
- `tsconfig.app.json` - TypeScript for app
- `tsconfig.node.json` - TypeScript for Node

### Dokumentasjon
- `warp.md` - Warp-spesifikk utviklerdokumentasjon
- `README.md` - Prosjektdokumentasjon

## Ekskludert
- Test-filer (`*.test.tsx`, `*.test.ts`, `*.spec.tsx`, `*.spec.ts`)
- node_modules
- Build-artefakter

## Teknologi-stack (styling)
- **Tailwind CSS** - Utility-first CSS framework
- **React** - Komponent-basert UI
- **TypeScript** - Type-sikkerhet
- **Vite** - Build tool

## Notater for Atlas
Dette prosjektet bruker:
- Tailwind CSS for det meste av stylingen
- Noen custom CSS i `brand.css` for merkevare-identitet
- Inline Tailwind-klasser i komponenter
- Responsive design patterns
- Component-based architecture med React
