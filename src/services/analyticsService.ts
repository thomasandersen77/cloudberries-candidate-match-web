import apiClient from './apiClient';

export interface ProgrammingLanguageStat {
  language: string;
  consultantCount: number;
  percentage: number; // 0-100
  aggregatedYears: number;
}

export interface RoleStat {
  role: string;
  consultantCount: number;
  percentage: number; // 0-100
}

export async function getLanguageStats(languages?: string[]): Promise<ProgrammingLanguageStat[]> {
  const params = new URLSearchParams();
  (languages ?? []).forEach(l => params.append('languages', l));
  const { data } = await apiClient.get<ProgrammingLanguageStat[]>(`/api/analytics/programming-languages${params.toString() ? `?${params.toString()}` : ''}`);
  return data;
}

export async function getRoleStats(): Promise<RoleStat[]> {
  const { data } = await apiClient.get<RoleStat[]>(`/api/analytics/roles`);
  return data;
}