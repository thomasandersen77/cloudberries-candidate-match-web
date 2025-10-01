import apiClient from './apiClient';

export type CoverageStatus = 'GREEN' | 'YELLOW' | 'RED' | 'NEUTRAL';

export interface MatchRequestListItem {
  id: number;
  title?: string | null;
  customerName?: string | null;
  date?: string | null; // uploadedAt or chosen date field
  deadlineDate?: string | null;
  hitCount?: number | null;
  coverageStatus?: CoverageStatus | null;
  coverageLabel?: string | null;
}

export interface PagedMatchRequestList {
  content?: MatchRequestListItem[];
  totalElements?: number;
  totalPages?: number;
  currentPage?: number;
  pageSize?: number;
  hasNext?: boolean;
  hasPrevious?: boolean;
}

export interface TopConsultantDto {
  consultantName: string;
  userId: string;
  cvId?: string;
  matchScore?: number;
  skills?: string[];
  justification?: string;
}

export async function listMatchRequests(params: { page?: number; size?: number; sort?: string } = {}): Promise<PagedMatchRequestList> {
  const { page = 0, size = 20, sort = 'date,desc' } = params;
  const { data } = await apiClient.get<PagedMatchRequestList>('/api/matches/requests', {
    params: { page, size, sort },
  });
  return data;
}

export async function getTopConsultantsForRequest(id: number, limit = 5): Promise<TopConsultantDto[]> {
  const { data } = await apiClient.get<TopConsultantDto[]>(`/api/matches/requests/${id}/top-consultants`, {
    params: { limit },
  });
  return data;
}