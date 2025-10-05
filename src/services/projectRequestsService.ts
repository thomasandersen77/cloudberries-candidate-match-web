import apiClient from './apiClient';
import type {
  ProjectRequestResponseDto,
  PagedProjectRequestResponseDto,
  CreateProjectRequestDto,
  ProjectRequestDto,
  AISuggestionDto,
} from '../types/api';

export async function uploadProjectRequest(file: File): Promise<ProjectRequestResponseDto> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<ProjectRequestResponseDto>(
    'project-requests/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }
  );
  return data;
}

export async function getProjectRequestById(id: number): Promise<ProjectRequestResponseDto | null> {
  const { data } = await apiClient.get<ProjectRequestResponseDto | null>(`project-requests/${id}`);
  return data;
}

// New: paged listing
export async function listProjectRequestsPaged(params: { page?: number; size?: number; sort?: string } = {}): Promise<PagedProjectRequestResponseDto> {
  // Sort by uploadedAt desc by default (nyeste først)
  const { page = 0, size = 20, sort = 'uploadedAt,desc' } = params;
  const { data } = await apiClient.get<PagedProjectRequestResponseDto>(`project-requests`, {
    params: { page, size, sort },
  });
  return data;
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
  const { data } = await apiClient.post<ProjectRequestDto>(`project-requests/${id}/analyze`);
  return data;
}

// New: get AI suggestions
export async function getProjectRequestSuggestions(id: number): Promise<AISuggestionDto[]> {
  const { data } = await apiClient.get<AISuggestionDto[]>(`project-requests/${id}/suggestions`);
  return data;
}
