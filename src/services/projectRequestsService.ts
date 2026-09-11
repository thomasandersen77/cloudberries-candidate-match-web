import apiClient, { aiScoringClient } from './apiClient';
import type {
  ProjectRequestResponseDto,
  PagedProjectRequestResponseDto,
  CreateProjectRequestDto,
  ProjectRequestDto,
  ProjectRequirementDto,
  AISuggestionDto,
} from '../types/api';

type LegacyProjectRequestDto = ProjectRequestDto & {
  id?: number;
  title?: string;
  summary?: string;
  originalFilename?: string;
  uploadedAt?: string;
  deadlineDate?: string;
  // Partial of the generated row rather than a shape of its own. Spelling the fields out here
  // once cost the appliesTo flag: the normaliser below rebuilt each row from the fields this type
  // knew about, the flag was not one of them, and it was dropped between the API and the screen
  // without tsc having anything to object to.
  mustRequirements?: Array<Partial<ProjectRequirementDto>>;
  shouldRequirements?: Array<Partial<ProjectRequirementDto>>;
};

function splitRequirements(requiredSkills: string[] = []) {
  const mustRequirements: ProjectRequirementDto[] = [];
  const shouldRequirements: ProjectRequirementDto[] = [];

  requiredSkills.forEach((entry) => {
    const text = (entry ?? '').trim();
    if (!text) return;
    // The legacy shape is a list of strings and says nothing about who has to satisfy them, which
    // is the same position rows extracted before the distinction existed are in.
    const req: ProjectRequirementDto = { name: text, details: '', appliesTo: 'CONSULTANT' as const };
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
  const named = (rows: Array<Partial<ProjectRequirementDto>>): ProjectRequirementDto[] => rows
    .filter((r) => typeof r?.name === 'string' && r.name.trim().length > 0)
    .map((r) => ({
      ...r,
      name: r.name!.trim(),
      // A row from a backend that predates the distinction is the consultant's, which is how it
      // was treated before there was anything else to call it.
      appliesTo: r.appliesTo ?? 'CONSULTANT'
    }));
  const mustFromApi = named(dto.mustRequirements ?? []);
  const shouldFromApi = named(dto.shouldRequirements ?? []);
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

export async function uploadProjectRequest(
  file: File,
  opts?: { useHighestQualityModel?: boolean },
): Promise<ProjectRequestResponseDto> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<LegacyProjectRequestDto>(
    'project-requests/upload',
    formData,
    {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 300000,
      params: opts?.useHighestQualityModel ? { useHighestQualityModel: 'true' } : undefined,
    },
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

// New: permanently delete a project request (DELETE /project-requests/{id})
export async function deleteProjectRequest(id: number): Promise<void> {
  await apiClient.delete(`project-requests/${encodeURIComponent(id)}`);
}

export type AiQualityOptions = {
  /** When true, ask backend for the server-configured highest-quality AI model tier. */
  useHighestQualityModel?: boolean;
};

// New: trigger AI analysis
export async function analyzeProjectRequest(id: number, opts?: AiQualityOptions): Promise<ProjectRequestDto> {
  const { data } = await aiScoringClient.post<ProjectRequestDto>(
    `project-requests/${id}/analyze`,
    null,
    { params: opts?.useHighestQualityModel ? { useHighestQualityModel: 'true' } : undefined }
  );
  return data;
}

// New: get AI suggestions
export async function getProjectRequestSuggestions(id: number): Promise<AISuggestionDto[]> {
  const { data } = await apiClient.get<AISuggestionDto[]>(`project-requests/${id}/suggestions`);
  return data;
}
