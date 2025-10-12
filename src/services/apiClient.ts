import axios from 'axios';
import { getToken, setToken } from './authService';

const rawBase = (import.meta.env?.VITE_API_BASE_URL ?? '/');
const BASE_URL = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

// Optional separate base for analytics service (e.g. teknologi-barometer-service)
const rawAnalyticsBase = import.meta.env?.VITE_ANALYTICS_BASE_URL as string | undefined;
const ANALYTICS_BASE = rawAnalyticsBase
  ? (rawAnalyticsBase.endsWith('/') ? rawAnalyticsBase : `${rawAnalyticsBase}/`)
  : BASE_URL; // fallback to main backend if not provided

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // Default timeout: 60s for most operations
  withCredentials: false, // We use Bearer tokens, not cookies
  headers: { Accept: 'application/json' },
});

// Dedicated client for analytics endpoints (can point to another service)
export const analyticsClient = axios.create({
  baseURL: ANALYTICS_BASE,
  timeout: 60000,
  withCredentials: false,
  headers: { Accept: 'application/json' },
});

// Lazy demo-auth bootstrap if no token is present
let authBootstrapPromise: Promise<void> | null = null;
const bootstrapAuthIfNeeded = async () => {
  if (getToken()) return;
  if (!authBootstrapPromise) {
const bootstrapClient = axios.create({ baseURL: BASE_URL, withCredentials: false });
    authBootstrapPromise = bootstrapClient
      .post<{ token: string }>('/auth/demo')
      .then(({ data }) => {
        if (data?.token) setToken(data.token);
      })
      .catch(() => void 0)
      .finally(() => {
        authBootstrapPromise = null;
      });
  }
  await authBootstrapPromise;
};

// Attach bearer token; if missing, fetch a demo token first
apiClient.interceptors.request.use(async (config) => {
  let token = getToken();
  if (!token) {
    await bootstrapAuthIfNeeded();
    token = getToken();
  }
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

analyticsClient.interceptors.request.use(async (config) => {
  let token = getToken();
  if (!token) {
    await bootstrapAuthIfNeeded();
    token = getToken();
  }
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Extended timeout client for AI scoring operations
export const aiScoringClient = axios.create({
  baseURL: BASE_URL,
  timeout: 300000, // 5 minutes for AI scoring operations
withCredentials: false,
  headers: { Accept: 'application/json' },
});

aiScoringClient.interceptors.request.use(async (config) => {
  let token = getToken();
  if (!token) {
    await bootstrapAuthIfNeeded();
    token = getToken();
  }
  if (token) {
    config.headers = config.headers ?? {};
    (config.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

apiClient.interceptors.response.use(
  (resp) => resp,
  (error) => {
    // You can expand error handling/logging here if desired
    return Promise.reject(error);
  }
);

export default apiClient;
