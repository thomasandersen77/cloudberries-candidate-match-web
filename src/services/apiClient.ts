import axios from 'axios';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
  timeout: 15000,
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
