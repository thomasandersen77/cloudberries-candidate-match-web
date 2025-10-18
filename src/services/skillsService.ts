import apiClient from './apiClient';
import type { SkillInCompanyDto, PageSkillSummaryDto, PageConsultantSummaryDto, ConsultantSummaryDto, RelationalSearchRequest } from '../types/api';

// Legacy (deprecated) full aggregate. Prefer summary + consultants endpoints.
export async function listSkills(filters?: string[]): Promise<SkillInCompanyDto[]> {
  const params: Record<string, string[] | undefined> = {};
  if (filters && filters.length) {
    params['skill'] = filters;
  }
  const { data } = await apiClient.get<SkillInCompanyDto[]>('skills', { params });
  // sort descending by count
  return [...data].sort((a, b) => (b.consultantCount ?? b.konsulenterMedSkill) - (a.consultantCount ?? a.konsulenterMedSkill));
}

export async function listSkillSummary(opts?: { q?: string; page?: number; size?: number; sort?: string }): Promise<PageSkillSummaryDto> {
  const params: Record<string, unknown> = {};
  if (opts?.q) (params as Record<string, unknown>).q = opts.q;
  if (opts?.page !== undefined) (params as Record<string, unknown>).page = opts.page;
  if (opts?.size !== undefined) (params as Record<string, unknown>).size = opts.size;
  if (opts?.sort) (params as Record<string, unknown>).sort = opts.sort;
  const { data } = await apiClient.get<PageSkillSummaryDto>('skills/summary', { params });
  return data;
}

export async function listConsultantsBySkill(skill: string, opts?: { page?: number; size?: number; sort?: string }): Promise<PageConsultantSummaryDto> {
  const page = opts?.page ?? 0;
  const size = opts?.size ?? 10;
  const sort = opts?.sort;

  // Helper to adapt relational search page -> PageConsultantSummaryDto (summary shape)
  const relationalFallback = async (): Promise<PageConsultantSummaryDto> => {
    const { searchConsultantsRelational } = await import('./consultantsService');
    const request: RelationalSearchRequest = { skillsAll: [skill], onlyActiveCv: false } as RelationalSearchRequest;
    const res = await searchConsultantsRelational({ request, page, size, sort: sort ? [sort] : undefined });
    const content: ConsultantSummaryDto[] = (res.content ?? []).map((c) => ({
      userId: c.userId,
      name: c.name,
      email: '',
      bornYear: 0,
      defaultCvId: c.cvId,
    }));
    return {
      content,
      number: res.number ?? page,
      size: res.size ?? size,
      totalElements: res.totalElements ?? content.length,
      totalPages: res.totalPages ?? 1,
      first: res.first ?? page === 0,
      last: res.last ?? true,
      sort: {},
      pageable: {},
    } as PageConsultantSummaryDto;
  };

  // If skill contains reserved path characters, skip direct endpoint
  const hasReserved = /[/%#?;]/.test(skill);
  if (hasReserved) {
    try { return await relationalFallback(); } catch { /* fall through */ }
  }

  try {
    const params: Record<string, unknown> = { page, size };
    if (sort) (params as Record<string, unknown>).sort = sort;
    const { data } = await apiClient.get<PageConsultantSummaryDto>(`skills/${encodeURIComponent(skill)}/consultants`, { params });
    return data;
  } catch {
    // 404/405/5xx -> fallback to relational search which is supported server-side
    try { return await relationalFallback(); } catch { /* final */ }
    // Return empty page on total failure to avoid UI crashes
    return { content: [], number: page, size, totalElements: 0, totalPages: 0, first: page === 0, last: true, sort: {}, pageable: {} };
  }
}

export async function listSkillNames(prefix?: string, limit: number = 100): Promise<string[]> {
  const params: Record<string, unknown> = { limit };
  if (prefix) (params as Record<string, unknown>).prefix = prefix;
  const { data } = await apiClient.get<string[]>('skills/names', { params });
  return data;
}

export async function listTopConsultantsBySkill(skill: string, limit: number = 3): Promise<ConsultantSummaryDto[]> {
  const fallback = async (): Promise<ConsultantSummaryDto[]> => {
    const { searchConsultantsRelational } = await import('./consultantsService');
    const request: RelationalSearchRequest = { skillsAll: [skill], onlyActiveCv: false } as RelationalSearchRequest;
    const res = await searchConsultantsRelational({ request, page: 0, size: Math.max(1, limit) });
    return (res.content ?? []).slice(0, limit).map((c) => ({
      userId: c.userId,
      name: c.name,
      email: '',
      bornYear: 0,
      defaultCvId: c.cvId,
    }));
  };

  // Skip direct endpoint if reserved characters
  const hasReserved = /[/%#?;]/.test(skill);
  if (hasReserved) {
    try { return await fallback(); } catch { /* fall through */ }
  }

  try {
    const { data } = await apiClient.get<ConsultantSummaryDto[]>(`skills/${encodeURIComponent(skill)}/top-consultants`, { params: { limit } });
    if (Array.isArray(data) && data.length) return data;
  } catch { /* ignore */ }

  // Fallback to relational search in all other cases
  try { return await fallback(); } catch { return []; }
}
