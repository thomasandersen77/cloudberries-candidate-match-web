# Azure Static Web Apps Deployment Guide

This document explains how to deploy the candidate-match frontend as an Azure Static Web App (SWA).

## Configuration Files

### staticwebapp.config.json
This file configures the Azure Static Web Apps runtime:

- **SPA Fallback**: Routes all non-asset, non-API requests to `/index.html` for React Router
- **API Proxy**: Proxies all `/api/*` requests to the backend container
- **Security Headers**: Adds security headers like `X-Content-Type-Options`, `X-Frame-Options`
- **MIME Types**: Ensures correct content types for JSON responses

The configuration uses a placeholder `__BACKEND_BASE_URL__` that gets replaced during CI/CD with the actual backend container URL.

### Environment Variables
- **Development**: Uses `/` as the API base, relies on Vite proxy (see `vite.config.ts`)
- **Production**: Uses `/api` as the API base, relies on SWA proxy to backend

## GitHub Actions Workflow

The deployment workflow (`.github/workflows/azure-static-web-apps-deploy.yml`) performs these steps:

1. **Build**: Runs `npm ci && npm run build` to create production assets
2. **Backend URL Injection**: Replaces `__BACKEND_BASE_URL__` in `staticwebapp.config.json` with the actual backend HTTPS URL
3. **Deploy**: Uses the Azure SWA deployment action to deploy the `dist/` folder

### Required GitHub Secrets

Set these secrets in your GitHub repository:

- **AZURE_STATIC_WEB_APPS_API_TOKEN**: Get this from the Azure Static Web App resource in the Azure portal
- **BACKEND_BASE_URL**: The HTTPS URL of your backend container (e.g., `https://candidate-match-backend.contoso.azurecontainerapps.io`)

## How the 404 Fix Works

The combination of Static Web Apps configuration and environment setup eliminates 404 errors:

1. **Frontend Code**: Uses `/api` as the base URL for all API calls in production
2. **SWA Proxy**: Routes `/api/*` requests to `{BACKEND_BASE_URL}/{path}` 
3. **Same-Origin**: All requests appear to come from the same origin (the SWA domain), eliminating CORS issues
4. **SPA Routing**: Non-API routes are handled by React Router via the `navigationFallback` config

## Local Testing with Azure SWA CLI (Optional)

To test the exact SWA behavior locally:

```bash
npm i -g @azure/static-web-apps-cli
npm run build
swa start dist --api-location http://localhost:8080
```

This runs the built app with SWA's local emulator, proxying API calls to your local backend.

## Deployment Process

1. **Deploy Backend**: First deploy your backend container to Azure (Container Apps or App Service)
2. **Get Backend URL**: Note the public HTTPS URL of the deployed backend
3. **Set GitHub Secrets**: Add the SWA token and backend URL to GitHub repository secrets
4. **Deploy Frontend**: Push to `main` branch or create a pull request to trigger the workflow
5. **Verify**: Check that API calls work and SPA routes don't return 404s

## Troubleshooting

- **404 on API calls**: Check that `BACKEND_BASE_URL` secret is set correctly and the backend is accessible
- **404 on routes**: Verify `staticwebapp.config.json` has correct `navigationFallback` configuration
- **CORS errors**: Should not occur with SWA proxy, but check backend CORS configuration if testing direct access