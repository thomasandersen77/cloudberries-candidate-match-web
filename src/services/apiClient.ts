import axios from 'axios';

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
  withCredentials: false, // No cookies; backend is fully open behind SWA
  headers: { Accept: 'application/json' },
});

// Dedicated client for analytics endpoints (can point to another service)
export const analyticsClient = axios.create({
  baseURL: ANALYTICS_BASE,
  timeout: 60000,
  withCredentials: false,
  headers: { Accept: 'application/json' },
});

// Extended timeout client for AI scoring operations
export const aiScoringClient = axios.create({
  baseURL: BASE_URL,
  timeout: 300000, // 5 minutes for AI scoring operations
  withCredentials: false,
  headers: { Accept: 'application/json' },
});

apiClient.interceptors.response.use(
  (resp) => resp,
  (error) => {
    // You can expand error handling/logging here if desired
    return Promise.reject(error);
  }
);

export default apiClient;
