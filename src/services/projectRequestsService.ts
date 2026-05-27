import apiClient, { aiScoringClient } from './apiClient';
import type {
  ProjectRequestResponseDto,
  PagedProjectRequestResponseDto,
  CreateProjectRequestDto,
  ProjectRequestDto,
  AISuggestionDto,
} from '../types/api';

type LegacyProjectRequestDto = ProjectRequestDto & {
  id?: number;
  title?: string;
  summary?: string;
  originalFilename?: string;
  uploadedAt?: string;
  deadlineDate?: string;
  mustRequirements?: Array<{ name?: string; details?: string }>;
  shouldRequirements?: Array<{ name?: string; details?: string }>;
};

function splitRequirements(requiredSkills: string[] = []) {
  const mustRequirements: Array<{ name: string; details?: string }> = [];
  const shouldRequirements: Array<{ name: string; details?: string }> = [];

  requiredSkills.forEach((entry) => {
    const text = (entry ?? '').trim();
    if (!text) return;
    const req = { name: text, details: '' };
    if (/\bbør\b/i.test(text) && !/\bmå\b/i.test(text)) {
      shouldRequirements.push(req);
    } else {
      mustRequirements.push(req);
    }
  });

  return { mustRequirements, shouldRequirements };
}

function deriveTitle(dto: LegacyProjectRequestDto): string {
  const title = (dto.title ?? '').trim();
  if (title.length >= 8) return title;

  const description = (dto.requestDescription ?? '').replace(/\s+/g, ' ').trim();
  if (description) {
    const firstSentence = description.split(/[.!?]/).find((s) => s.trim().length > 20)?.trim();
    if (firstSentence) return firstSentence;
  }

  if (dto.customerName?.trim()) return `Behov fra ${dto.customerName.trim()}`;
  return 'Kundeforspørsel';
}

function normalizeProjectRequestResponse(dto: LegacyProjectRequestDto): ProjectRequestResponseDto {
  const mustFromApi = (dto.mustRequirements ?? [])
    .filter((r): r is { name: string; details?: string } => typeof r?.name === 'string' && r.name.trim().length > 0)
    .map((r) => ({ name: r.name.trim(), details: r.details }));
  const shouldFromApi = (dto.shouldRequirements ?? [])
    .filter((r): r is { name: string; details?: string } => typeof r?.name === 'string' && r.name.trim().length > 0)
    .map((r) => ({ name: r.name.trim(), details: r.details }));
  const fromRequiredSkills = splitRequirements(dto.requiredSkills ?? []);

  return {
    id: dto.id,
    customerName: dto.customerName ?? '',
    originalFilename: dto.originalFilename ?? '',
    title: deriveTitle(dto),
    summary: (dto.summary ?? dto.requestDescription ?? '').trim(),
    mustRequirements: mustFromApi.length > 0 ? mustFromApi : fromRequiredSkills.mustRequirements,
    shouldRequirements: shouldFromApi.length > 0 ? shouldFromApi : fromRequiredSkills.shouldRequirements,
    // Fallbacks for legacy backend shape
    uploadedAt: dto.uploadedAt ?? dto.startDate,
    deadlineDate: dto.deadlineDate ?? dto.responseDeadline,
  };
}

export async function uploadProjectRequest(file: File): Promise<ProjectRequestResponseDto> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<LegacyProjectRequestDto>(
    'project-requests/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 300000 }
  );
  return normalizeProjectRequestResponse(data);
}

export async function getProjectRequestById(id: number): Promise<ProjectRequestResponseDto | null> {
  const { data } = await apiClient.get<LegacyProjectRequestDto | null>(`project-requests/${id}`);
  return data ? normalizeProjectRequestResponse(data) : null;
}

// New: paged listing
export async function listProjectRequestsPaged(params: { page?: number; size?: number; sort?: string } = {}): Promise<PagedProjectRequestResponseDto> {
  // Sort by uploadedAt desc by default (nyeste først)
  const { page = 0, size = 20, sort = 'uploadedAt,desc' } = params;
  const { data } = await apiClient.get<PagedProjectRequestResponseDto & { content?: LegacyProjectRequestDto[] }>(`project-requests`, {
    params: { page, size, sort },
  });
  return {
    ...data,
    content: (data.content ?? []).map(normalizeProjectRequestResponse),
  };
}

// Backwards-compatible helper to return the first page content only
export async function listProjectRequests(): Promise<ProjectRequestResponseDto[]> {
  const page = await listProjectRequestsPaged({ page: 0, size: 20, sort: 'id,desc' });
  return page.content ?? [];
}

// New: create project request
export async function createProjectRequest(body: CreateProjectRequestDto): Promise<ProjectRequestDto> {
  const { data } = await apiClient.post<ProjectRequestDto>(`project-requests`, body);
  return data;
}

// New: close project request
export async function closeProjectRequest(id: number): Promise<ProjectRequestDto> {
  const { data } = await apiClient.put<ProjectRequestDto>(`project-requests/${id}/close`);
  return data;
}

// New: trigger AI analysis
export async function analyzeProjectRequest(id: number): Promise<ProjectRequestDto> {
  const { data } = await aiScoringClient.post<ProjectRequestDto>(`project-requests/${id}/analyze`);
  return data;
}

// New: get AI suggestions
export async function getProjectRequestSuggestions(id: number): Promise<AISuggestionDto[]> {
  const { data } = await apiClient.get<AISuggestionDto[]>(`project-requests/${id}/suggestions`);
  return data;
}
