import apiClient from './apiClient';
import type { ProjectRequestResponseDto } from '../types/api';

export async function uploadProjectRequest(file: File): Promise<ProjectRequestResponseDto> {
  const formData = new FormData();
  formData.append('file', file);
  const { data } = await apiClient.post<ProjectRequestResponseDto>(
    '/api/project-requests/upload',
    formData,
    { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }
  );
  return data;
}

export async function getProjectRequestById(id: number): Promise<ProjectRequestResponseDto | null> {
  const { data } = await apiClient.get<ProjectRequestResponseDto | null>(`/api/project-requests/${id}`);
  return data;
}

export async function listProjectRequests(): Promise<ProjectRequestResponseDto[]> {
  const { data } = await apiClient.get<ProjectRequestResponseDto[]>(`/api/project-requests`);
  return data;
}
