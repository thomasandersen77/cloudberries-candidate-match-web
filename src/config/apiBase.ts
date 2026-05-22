/**
 * Resolves the axios base URL for backend API calls.
 *
 * - Production (Render): set VITE_API_BASE_URL=https://cloudberries-candidate-match.onrender.com
 *   Spring servlet path /api is appended once when missing.
 * - Local dev: .env.development uses VITE_API_BASE_URL=/api (Vite proxy → localhost:8080).
 * - Missing env: http://localhost:8080 (+ /api when absolute).
 */

const AZURE_LEGACY_HOST = /containerapps\.io|render-legacy/i;
const SERVLET_PATH = '/api';

function warnIfAzureHost(url: string): void {
  if (AZURE_LEGACY_HOST.test(url)) {
    console.warn(
      '[api] VITE_API_BASE_URL points to deprecated Azure Container Apps. ' +
        'Use https://cloudberries-candidate-match.onrender.com and redeploy the frontend.'
    );
  }
}

/** True when backend uses spring.mvc.servlet.path=/api and base should include /api once. */
function hasApiServletPrefix(path: string): boolean {
  return /\/api\/?$/i.test(path);
}

/**
 * Resolves API base URL used by axios (trailing slash).
 * Relative paths (e.g. /api) are used as-is for the Vite dev proxy.
 */
export function resolveApiBaseUrl(): string {
  const raw = import.meta.env.VITE_API_BASE_URL?.trim();

  if (raw) {
    warnIfAzureHost(raw);
  }

  const fallback = 'http://localhost:8080';
  const base = raw || fallback;

  // Vite dev proxy: relative /api → browser calls same origin /api/*
  if (base.startsWith('/')) {
    return base.endsWith('/') ? base : `${base}/`;
  }

  let absolute = base.replace(/\/+$/, '');

  if (!hasApiServletPrefix(absolute)) {
    absolute = `${absolute}${SERVLET_PATH}`;
  }

  return `${absolute}/`;
}

/** Backend origin without /api suffix (for actuator and other root-level endpoints). */
export function getBackendOrigin(): string {
  const base = resolveApiBaseUrl();
  if (base.startsWith('/')) {
    return 'http://localhost:8080';
  }
  return base.replace(/\/api\/?$/i, '').replace(/\/+$/, '');
}

export function logApiBaseUrlInDev(): void {
  if (!import.meta.env.DEV) return;
  const base = resolveApiBaseUrl();
  const env = import.meta.env.VITE_API_BASE_URL?.trim() || '(not set, using localhost:8080)';
  console.info(`[api] VITE_API_BASE_URL=${env} → resolved base: ${base}`);
}
