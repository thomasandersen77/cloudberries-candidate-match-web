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

  // If skill contains characters that may be rejected as path variables (e.g. '/')
  // fall back to relational search which accepts skill in the request body.
  const needsFallback = /[/%#?;]/.test(skill);
  if (needsFallback) {
    try {
      const { searchConsultantsRelational } = await import('./consultantsService');
      const request: RelationalSearchRequest = { skillsAll: [skill], onlyActiveCv: false } as RelationalSearchRequest;
      const res = await searchConsultantsRelational({
        request,
        page,
        size,
      });
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
    } catch {
      // If fallback fails, continue to try the direct endpoint (may still work)
    }
  }

  const params: Record<string, unknown> = { page, size };
  if (sort) (params as Record<string, unknown>).sort = sort;
  const { data } = await apiClient.get<PageConsultantSummaryDto>(`skills/${encodeURIComponent(skill)}/consultants`, { params });
  return data;
}

export async function listSkillNames(prefix?: string, limit: number = 100): Promise<string[]> {
  const params: Record<string, unknown> = { limit };
  if (prefix) (params as Record<string, unknown>).prefix = prefix;
  const { data } = await apiClient.get<string[]>('skills/names', { params });
  return data;
}

export async function listTopConsultantsBySkill(skill: string, limit: number = 3): Promise<ConsultantSummaryDto[]> {
  // Similar fallback logic for skills with reserved characters
  const needsFallback = /[/%#?;]/.test(skill);
  if (needsFallback) {
    try {
      const { searchConsultantsRelational } = await import('./consultantsService');
      const request: RelationalSearchRequest = { skillsAll: [skill], onlyActiveCv: false } as RelationalSearchRequest;
      const res = await searchConsultantsRelational({
        request,
        page: 0,
        size: Math.max(1, limit),
      });
      return (res.content ?? []).slice(0, limit).map((c) => ({
        userId: c.userId,
        name: c.name,
        email: '',
        bornYear: 0,
        defaultCvId: c.cvId,
      }));
    } catch {
      // fall through to endpoint attempt
    }
  }
  try {
    const { data } = await apiClient.get<ConsultantSummaryDto[]>(`skills/${encodeURIComponent(skill)}/top-consultants`, {
      params: { limit },
    });
    return data ?? [];
  } catch {
    return [];
  }
}
