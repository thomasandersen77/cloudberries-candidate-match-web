import apiClient from './apiClient';

// Interface for den detaljerte helsestatusen til hver avhengighet
import type { HealthResponse as HealthStatus } from '../types/api';

export interface HealthDetails {
  database?: 'UP' | 'DOWN' | boolean;
  flowcase?: 'UP' | 'DOWN' | boolean;
  genAI_operational?: 'UP' | 'DOWN' | boolean;
  genAI_configured?: 'UP' | 'DOWN' | boolean;
}

// Konstanter for caching/locking
const TTL_MS = 5 * 60 * 1000; // 5 minutter
const CACHE_KEY = 'health:last';
const LOCK_KEY = 'health:lock';
const LOCK_TTL_MS = 10_000; // 10s safety lock

let inFlightPromise: Promise<HealthStatus> | null = null;
const TAB_ID = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

// Standard DOWN-status for hard failures uten tidligere cache
const defaultDownStatus: HealthStatus = {
  status: 'DOWN',
  details: {
    database: 'DOWN',
    flowcase: 'DOWN',
    genAI_operational: 'DOWN',
    genAI_configured: 'DOWN',
  },
} as unknown as HealthStatus;

function isHardReload(): boolean {
  try {
    // Navigation Timing v2
    const nav = (performance.getEntriesByType?.('navigation') || []) as PerformanceNavigationTiming[];
    if (nav[0]) return nav[0].type === 'reload';
    // Legacy
    const legacyType = (performance as any)?.navigation?.type;
    return legacyType === 1; // TYPE_RELOAD
  } catch {
    return false;
  }
}

function now(): number { return Date.now(); }
function isFresh(ts: number): boolean { return now() - ts < TTL_MS; }

function readCache(): { ts: number; payload: HealthStatus; source?: string } | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeCache(entry: { ts: number; payload: HealthStatus; source?: string }): void {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify(entry)); } catch { /* noop */ }
}

function readLock(): { tabId: string; startedAt: number; expiresAt: number } | null {
  try {
    const raw = localStorage.getItem(LOCK_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function writeLock(lock: { tabId: string; startedAt: number; expiresAt: number }): void {
  try { localStorage.setItem(LOCK_KEY, JSON.stringify(lock)); } catch { /* noop */ }
}

function clearLock(): void {
  try { localStorage.removeItem(LOCK_KEY); } catch { /* noop */ }
}

function waitForCacheUpdateOrLockRelease(timeoutMs = 15000): Promise<void> {
  return new Promise((resolve) => {
    const start = now();

    const check = () => {
      const lock = readLock();
      const cache = readCache();
      if (!lock || (cache && isFresh(cache.ts)) || now() - start > timeoutMs) {
        cleanup();
        resolve();
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === CACHE_KEY || e.key === LOCK_KEY) {
        check();
      }
    };

    function cleanup() {
      try { window.removeEventListener('storage', onStorage); } catch { /* noop */ }
      clearInterval(timer);
    }

    try { window.addEventListener('storage', onStorage); } catch { /* noop */ }
    const timer = setInterval(check, 250);
  });
}

async function acquireLockOrWait(): Promise<'acquired' | 'waited'> {
  const ts = now();
  const existing = readLock();
  if (existing && ts < existing.expiresAt) {
    await waitForCacheUpdateOrLockRelease();
    return 'waited';
  }
  const myLock = { tabId: TAB_ID, startedAt: ts, expiresAt: ts + LOCK_TTL_MS };
  writeLock(myLock);
  const current = readLock();
  if (current?.tabId === TAB_ID && current?.startedAt === myLock.startedAt) {
    return 'acquired';
  }
  await waitForCacheUpdateOrLockRelease();
  return 'waited';
}

async function fetchNetwork(): Promise<{ payload: HealthStatus; source: string }> {
  // Primær: /api/health (OpenAPI)
  try {
    const resp = await apiClient.get<HealthStatus>('health');
    if (resp.data && resp.data.status) {
      return { payload: resp.data, source: 'api/health' };
    }
  } catch {
    // fallthrough
  }
  // Fallback: Actuator (/actuator/health). Merk: fungerer typisk mest lokalt.
  const r2 = await apiClient.get<unknown>('/actuator/health');
  const data = r2.data as { status?: unknown; details?: unknown; components?: unknown };
  if (!data || !data.status) throw new Error('Actuator health missing status');
  const details = data.details ?? data.components ?? {};
  return { payload: { status: String(data.status) as HealthStatus['status'], details } as HealthStatus, source: 'actuator/health' };
}

/**
 * Henter helsestatus med 5-min TTL delt på tvers av faner, og bypass ved ekte reload.
 */
export const getHealthStatus = async (): Promise<HealthStatus> => {
  const reload = isHardReload();

  // Rask retur fra cache når ikke reload og frisk cache finnes
  try {
    const cached = readCache();
    if (!reload && cached && isFresh(cached.ts)) {
      return cached.payload;
    }
  } catch {
    // ignore cache read errors
  }

  if (inFlightPromise) return inFlightPromise;

  inFlightPromise = (async () => {
    // Sørg for single-flight på tvers av faner
    const mode = await acquireLockOrWait();
    if (mode === 'waited') {
      const c2 = readCache();
      // Ved reload aksepter cache som andre fane nettopp oppdaterte (frisk eller ej)
      if (c2 && (!reload ? isFresh(c2.ts) : true)) {
        inFlightPromise = null;
        return c2.payload;
      }
      // Prøv en gang til å ta lås dersom ingen annen fane oppdaterte
      const mode2 = await acquireLockOrWait();
      if (mode2 === 'waited') {
        const c3 = readCache();
        if (c3) { inFlightPromise = null; return c3.payload; }
      }
    }

    // Vi har låsen – gjør nettverkskall
    try {
      const { payload, source } = await fetchNetwork();
      writeCache({ ts: now(), payload, source });
      return payload;
  } catch (_e) {
      // På feil: returner eventuell gammel cache, ellers DOWN
      const stale = readCache();
      if (stale?.payload) return stale.payload;
      return defaultDownStatus;
    } finally {
      clearLock();
      inFlightPromise = null;
    }
  })();

  return inFlightPromise;
};

/**
 * Mock for utviklingstesting
 */
export const getHealthStatusMock = async (): Promise<{
  status: string;
  details: { database: boolean; flowcase: boolean; genAI_operational: boolean; genAI_configured: boolean }
}> => {
  await new Promise(resolve => setTimeout(resolve, 500));
  return {
    status: 'UP',
    details: { database: true, flowcase: true, genAI_operational: false, genAI_configured: true }
  };
};
