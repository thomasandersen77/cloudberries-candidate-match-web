import apiClient from './apiClient';
import type {
  SkillInCompanyDto,
  PageSkillSummaryDto,
  PageConsultantSummaryDto,
  ConsultantSummaryDto,
  RelationalSearchRequest,
  SkillConsultantRankingDto,
} from '../types/api';
import { mapToConsultantSummaryDto, mapToConsultantSummaryPage, searchConsultantsRelational } from './consultantsService';

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
    const request: RelationalSearchRequest = { skillsAll: [skill], onlyActiveCv: false } as RelationalSearchRequest;
    const res = await searchConsultantsRelational({ request, page, size, sort: sort ? [sort] : undefined });
    const content: ConsultantSummaryDto[] = (res.content ?? []).map((c) =>
      mapToConsultantSummaryDto({ userId: c.userId, name: c.name, cvId: c.cvId })
    );
    return mapToConsultantSummaryPage(content, page, size, {
      number: res.number,
      size: res.size,
      totalElements: res.totalElements,
      totalPages: res.totalPages,
      first: res.first,
      last: res.last,
    });
  };

  // The skill in a query parameter, not in the path.
  //
  // It used to be the path, and a skill name with a slash in it does not survive one: "JAVA/KOTLIN"
  // became skills/JAVA/KOTLIN/consultants, which is a different route and answered 404. The guard
  // below sent those to a relational search instead, and that could not resolve them either — a
  // group name is not a skill anybody has, so the server logged "resolved 0 of 1 required skills"
  // and returned an empty page. The screen showed nothing at all.
  //
  // It affected every catalogue name with one of these characters, not only that row: CI/CD with
  // eighteen consultants, PL/SQL with nine, HTML/CSS, REST / JSON. The endpoint taking the skill as
  // a parameter was already in the same controller and handles both.
  try {
    const params: Record<string, unknown> = { skill, page, size };
    if (sort) (params as Record<string, unknown>).sort = sort;
    const { data } = await apiClient.get<PageConsultantSummaryDto>('skills/consultants', { params });
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
/** The skill as a parameter here too, and for the same reason as in listConsultantsBySkill. */
export async function listTopRankedConsultantsBySkill(
  skill: string,
  limit: number = 3
): Promise<SkillConsultantRankingDto[]> {
  const { data } = await apiClient.get<SkillConsultantRankingDto[]>(
    'skills/top-ranked-consultants',
    { params: { skill, limit, onlyActiveCv: true } }
  );
  return data;
}

function toConsultantSummaryFromRanking(item: SkillConsultantRankingDto): ConsultantSummaryDto {
  return {
    userId: item.id ?? '',
    name: item.name ?? '',
    email: item.email ?? '',
    bornYear: item.bornYear ?? 0,
    defaultCvId: item.defaultCvId ?? '',
  };
}

export async function listTopConsultantsBySkill(skill: string, limit: number = 3): Promise<ConsultantSummaryDto[]> {
  const fallback = async (): Promise<ConsultantSummaryDto[]> => {
    const request: RelationalSearchRequest = { skillsAll: [skill], onlyActiveCv: false } as RelationalSearchRequest;
    const res = await searchConsultantsRelational({ request, page: 0, size: Math.max(1, limit) });
    return (res.content ?? []).slice(0, limit).map((c) =>
      mapToConsultantSummaryDto({ userId: c.userId, name: c.name, cvId: c.cvId })
    );
  };

  // No reserved-character guard any more: the ranked lookup below takes the skill as a parameter
  // and handles a slash. Jumping straight to the relational search sent a group name somewhere that
  // cannot resolve one, and returned nothing for a skill the ranked endpoint answers fine.
  try {
    const ranked = await listTopRankedConsultantsBySkill(skill, limit);
    if (Array.isArray(ranked) && ranked.length > 0) {
      return ranked.map(toConsultantSummaryFromRanking);
    }
  } catch { /* ignore */ }

  try {
    const { data } = await apiClient.get<ConsultantSummaryDto[]>(`skills/${encodeURIComponent(skill)}/top-consultants`, { params: { limit } });
    if (Array.isArray(data) && data.length) return data;
  } catch { /* ignore */ }

  // Fallback to relational search in all other cases
  try { return await fallback(); } catch { return []; }
}
