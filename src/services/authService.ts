import apiClient from './apiClient';

const TOKEN_KEY = 'auth_token';

export const getToken = (): string | null => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token: string) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    // Intentionally ignore localStorage write errors (e.g., disabled/private mode)
    void 0;
  }
};

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Intentionally ignore localStorage remove errors
    void 0;
  }
};

export const login = async (username: string, password: string) => {
  const { data } = await apiClient.post<{ token: string }>(`/auth/login`, { username, password });
  setToken(data.token);
  return data.token;
};

export const demoLogin = async () => {
  const { data } = await apiClient.post<{ token: string }>(`/auth/demo`);
  setToken(data.token);
  return data.token;
};
