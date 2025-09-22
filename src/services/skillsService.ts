import apiClient from './apiClient';
import type { SkillInCompanyDto } from '../types/api';

export async function listSkills(filters?: string[]): Promise<SkillInCompanyDto[]> {
  const params: Record<string, string[] | undefined> = {};
  if (filters && filters.length) {
    params['skill'] = filters;
  }
  const { data } = await apiClient.get<SkillInCompanyDto[]>('/api/skills', { params });
  // sort descending by count
  return [...data].sort((a, b) => b.konsulenterMedSkill - a.konsulenterMedSkill);
}