import axios from 'axios';
import { getToken, setToken } from './authService';

const rawBase = (import.meta.env?.VITE_API_BASE_URL ?? '/');
const BASE_URL = rawBase.endsWith('/') ? rawBase : `${rawBase}/`;

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // Default timeout: 60s for most operations
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

// Lazy demo-auth bootstrap if no token is present
let authBootstrapPromise: Promise<void> | null = null;
const bootstrapAuthIfNeeded = async () => {
  if (getToken()) return;
  if (!authBootstrapPromise) {
    const bootstrapClient = axios.create({ baseURL: BASE_URL, withCredentials: true });
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

// Extended timeout client for AI scoring operations
export const aiScoringClient = axios.create({
  baseURL: BASE_URL,
  timeout: 300000, // 5 minutes for AI scoring operations
  withCredentials: true,
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
