# Warp guide for cloudberries-candidate-match-web

This document is a lightweight runbook for local development, CI/CD, and smooth handovers. Pair it with the reusable
workflows in `warp.mf`.

## Prerequisites

- macOS + Warp Terminal
- Homebrew (installed)
- Node.js (use the repo's preferred version manager; e.g. nvm)
- Optional Java tooling (follow team rule):
    - Install SDKMAN, then JDK and Maven via SDKMAN

```bash
# SDKMAN (optional, for Java-related tooling)
curl -s "https://get.sdkman.io" | bash
source "$HOME/.sdkman/bin/sdkman-init.sh"
sdk install java 21.0.7-tem
sdk install maven
```

## Getting started

```bash
# 1) Install dependencies
npm install  # replace with yarn/pnpm if the repo uses those

# 2) Run the app locally
npm run dev

# 3) Lint / Test
npm run lint
npm test

# 4) Build
npm run build
```

If commands differ in this repo, update scripts in package.json and the workflows in `warp.mf` accordingly.

## Common workflows (Warp)

Use the pre-defined workflows in `warp.mf` from Warp’s command palette:

- install → install dependencies
- dev → start dev server
- lint → run linters
- test → run tests
- build → production build
- docker:build → build a Docker image with {{image_tag}}
- azdo:pipelines:run → run an Azure DevOps pipeline with {{pipeline_name}} on {{branch}}

## Git and PR workflow

- Trunk-based: short-lived feature branches, frequent PRs
- Conventional Commits (e.g. `feat:`, `fix:`, `chore:`)
- Branch naming: `feature/<ticket-id>-<short-desc>` or `fix/<ticket-id>-<short-desc>`
- PRs must include: What/Why, test notes, risk/rollback, links to Boards items
- At least 1–2 reviewers; green CI required before merge

## CI/CD (Azure Static Web Apps + GitHub Actions)

### 🚀 Current Setup: Azure Static Web Apps
- **Live URL**: https://delightful-meadow-056d48003.1.azurestaticapps.net/
- **GitHub Actions Workflow**: `.github/workflows/azure-static-web-apps-delightful-meadow-056d48003.yml`
- **Deployment**: Automatic on push to `main` branch
- **Build Output**: `build/` directory (configured in `vite.config.ts`)

### Deployment Pipeline Stages
1. **Checkout** → code from GitHub
2. **Build** → `npm ci && npm run build` (outputs to `build/`)
3. **Deploy** → Azure Static Web Apps GitHub Action
4. **API Proxy** → Routes `/api/*` to backend Container App

### Key Configuration Files
- `vite.config.ts` → Build output to `build/` directory
- `staticwebapp.config.json` → API routing and permissions
- `.github/workflows/azure-static-web-apps-*.yml` → Deployment workflow

### Backend Integration
- **Backend API**: https://cloudberries-candidate-match-ca.whitesand-767916af.westeurope.azurecontainerapps.io/
- **Local Development**: Backend proxied through Vite dev server (port 8080)
- **Production**: API calls routed through Static Web Apps configuration

### Legacy CI/CD (Azure DevOps)
- Org: https://dev.azure.com/cloudberriesas/
- Typical pipeline stages: install → lint/test → build → (optional) deploy
- Variables and secrets: use Variable Groups and Key Vault (no secrets in YAML)
- For infra repos, apply uses approvals via Environments

## Security and secrets

- Do not commit secrets. Fetch from secure stores and export into env vars locally
- For local DB access: use username/password only (no client certificate auth)

## Handover checklist

- Small, focused PRs linked to a Board task
- Update README and this warp.md when behavior or commands change
- Ensure `npm test` and linting are green locally and in CI
- Add/adjust `warp.mf` workflows if new commands were introduced
- Include rollback notes and feature flags if applicable

## Azure Deployment

### 🚀 Quick Deploy Commands
```bash
# Verify build works locally
npm ci
npm run build
ls -la build/  # Should contain index.html and assets/

# Test local preview
npm run preview

# Force redeploy (push to main)
git commit --allow-empty -m "Force redeploy"
git push
```

### 🔍 Health Checks
```bash
# Frontend
curl https://delightful-meadow-056d48003.1.azurestaticapps.net/

# Backend (through SWA proxy)
curl https://delightful-meadow-056d48003.1.azurestaticapps.net/api/actuator/health

# Backend (direct)
curl https://cloudberries-candidate-match-ca.whitesand-767916af.westeurope.azurecontainerapps.io/actuator/health
```

#### Frontend helsesjekk-struping
- Maks ett kall per 5 minutter på tvers av faner (deles via localStorage).
- Ekte side-reload bypasser TTL og utløser nytt kall, men koordineres slik at bare én fane kaller backend.
- Primær endepunkt: `/api/health`; fallback til `/actuator/health` hovedsakelig i lokal utvikling.

### 🛠️ Common Azure Issues

#### Build Failures
- **Wrong output directory**: Ensure `vite.config.ts` has `outDir: 'build'`
- **Build command fails**: Test `npm run build` locally first
- **Node version**: Verify Node.js version compatibility

#### API Connection Issues
- **CORS errors**: Check backend allows Static Web Apps domain
- **404 on API calls**: Verify `staticwebapp.config.json` routes
- **Backend down**: Check Container Apps status in Azure Portal

#### SPA Routing Issues
- **404 on page refresh**: Static Web Apps should handle automatically
- **Missing routes**: Check React Router configuration

### 📋 Monitoring
- **GitHub Actions**: https://github.com/thomasandersen77/cloudberries-candidate-match-web/actions
- **Azure Portal**: Static Web Apps overview and logs
- **Container Apps**: Backend health and container logs

## Troubleshooting

- Node version mismatches: check `.nvmrc` or `.tool-versions` if present
- Clean install: remove node_modules and lockfile, then re-install
- Verify CI parity: run the same commands locally as in pipelines
- **Azure build issues**: Check GitHub Actions logs and ensure `build/` output
- **API proxy issues**: Verify `staticwebapp.config.json` configuration

## Useful links

### 🌐 Production URLs
- **Frontend (Live)**: https://delightful-meadow-056d48003.1.azurestaticapps.net/
- **Backend API**: https://cloudberries-candidate-match-ca.whitesand-767916af.westeurope.azurecontainerapps.io/
- **API Health Check**: https://delightful-meadow-056d48003.1.azurestaticapps.net/api/actuator/health

### 🚀 Development & CI/CD
- **GitHub Actions**: https://github.com/thomasandersen77/cloudberries-candidate-match-web/actions
- **GitHub Repo**: https://github.com/thomasandersen77/cloudberries-candidate-match-web
- **Backend Repo**: https://github.com/thomasandersen77/cloudberries-candidate-match

### ☂️ Azure Resources
- **Static Web Apps Portal**: https://portal.azure.com/#@cloudberriesas.onmicrosoft.com/resource/subscriptions/reb3fcd6-f9ae-47b4-9b4a-6f5e84b2f2ba/resourceGroups/cloudberries-internal-dev/providers/Microsoft.Web/staticSites/delightful-meadow-056d48003/overview
- **Container Apps Portal**: https://portal.azure.com/#@cloudberriesas.onmicrosoft.com/resource/subscriptions/reb3fcd6-f9ae-47b4-9b4a-6f5e84b2f2ba/resourceGroups/cloudberries-internal-dev/providers/Microsoft.App/containerApps/cloudberries-candidate-match-ca/overview

### 🛠️ Tools & Documentation
- **Azure DevOps org**: https://dev.azure.com/cloudberriesas/ (legacy)
- **Warp Notebooks and Workflows**: https://docs.warp.dev/features/warp-drive/
- **Azure Static Web Apps Docs**: https://docs.microsoft.com/en-us/azure/static-web-apps/
- **Azure Container Apps Docs**: https://docs.microsoft.com/en-us/azure/container-apps/
