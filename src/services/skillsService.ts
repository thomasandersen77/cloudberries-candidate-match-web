import apiClient from './apiClient';
import type { SkillInCompanyDto, PageSkillSummaryDto, PageConsultantSummaryDto, ConsultantSummaryDto } from '../types/api';

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
  const params: Record<string, any> = {};
  if (opts?.q) params.q = opts.q;
  if (opts?.page !== undefined) params.page = opts.page;
  if (opts?.size !== undefined) params.size = opts.size;
  if (opts?.sort) params.sort = opts.sort;
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
      const res = await searchConsultantsRelational({
        request: { skillsAll: [skill], onlyActiveCv: false } as any,
        page,
        size,
      });
      const content = (res.content ?? []).map((c: any) => ({
        userId: c.userId,
        name: c.name,
        email: '',
        bornYear: 0,
        defaultCvId: c.cvId,
      })) as any[];
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
    } catch (e) {
      // If fallback fails, continue to try the direct endpoint (may still work)
    }
  }

  const params: Record<string, any> = { page, size };
  if (sort) params.sort = sort;
  const { data } = await apiClient.get<PageConsultantSummaryDto>(`skills/${encodeURIComponent(skill)}/consultants`, { params });
  return data;
}

export async function listSkillNames(prefix?: string, limit: number = 100): Promise<string[]> {
  const params: Record<string, any> = { limit };
  if (prefix) params.prefix = prefix;
  const { data } = await apiClient.get<string[]>('skills/names', { params });
  return data;
}

export async function listTopConsultantsBySkill(skill: string, limit: number = 3): Promise<ConsultantSummaryDto[]> {
  // Similar fallback logic for skills with reserved characters
  const needsFallback = /[/%#?;]/.test(skill);
  if (needsFallback) {
    try {
      const { searchConsultantsRelational } = await import('./consultantsService');
      const res = await searchConsultantsRelational({
        request: { skillsAll: [skill], onlyActiveCv: false } as any,
        page: 0,
        size: Math.max(1, limit),
      });
      return (res.content ?? []).slice(0, limit).map((c: any) => ({
        userId: c.userId,
        name: c.name,
        email: '',
        bornYear: 0,
        defaultCvId: c.cvId,
      })) as any[];
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
