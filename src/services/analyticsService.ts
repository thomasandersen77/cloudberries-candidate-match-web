import apiClient from './apiClient';
import type { LanguageStat, RoleStat } from '../types/analytics';

// For backward compatibility alias
export type ProgrammingLanguageStat = LanguageStat;
export type { RoleStat };

export async function getLanguageStats(languages?: string[]): Promise<LanguageStat[]> {
  const params = new URLSearchParams();
  (languages ?? []).forEach(l => params.append('languages', l));
  const { data } = await apiClient.get<LanguageStat[]>(`analytics/programming-languages${params.toString() ? `?${params.toString()}` : ''}`);
  return data;
}

export async function getRoleStats(): Promise<RoleStat[]> {
  const { data } = await apiClient.get<RoleStat[]>(`analytics/roles`);
  return data;
}
