import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 60000, // Default timeout: 60s for most operations
  withCredentials: true,
  headers: { Accept: 'application/json' },
});

// Extended timeout client for AI scoring operations
export const aiScoringClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 300000, // 5 minutes for AI scoring operations
  withCredentials: true,
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
