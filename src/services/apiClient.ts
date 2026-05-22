import axios from 'axios';
import { logApiBaseUrlInDev, resolveApiBaseUrl } from '../config/apiBase';

const BASE_URL = resolveApiBaseUrl();
logApiBaseUrlInDev();

const rawAnalyticsBase = import.meta.env.VITE_ANALYTICS_BASE_URL as string | undefined;
const ANALYTICS_BASE = rawAnalyticsBase
  ? (rawAnalyticsBase.endsWith('/') ? rawAnalyticsBase : `${rawAnalyticsBase}/`)
  : BASE_URL;

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 180000,
  withCredentials: false,
  headers: { Accept: 'application/json' },
});

export const analyticsClient = axios.create({
  baseURL: ANALYTICS_BASE,
  timeout: 180000,
  withCredentials: false,
  headers: { Accept: 'application/json' },
});

export const aiScoringClient = axios.create({
  baseURL: BASE_URL,
  timeout: 600000,
  withCredentials: false,
  headers: { Accept: 'application/json' },
});

apiClient.interceptors.response.use(
  (resp) => resp,
  (error) => Promise.reject(error)
);

export { BASE_URL };
export default apiClient;
