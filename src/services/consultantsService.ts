import apiClient from './apiClient';
import type { PageConsultantSummaryDto } from '../types/api';

export async function listConsultants(params: { name?: string; page?: number; size?: number; sort?: string[] } = {}): Promise<PageConsultantSummaryDto> {
  const { name, page = 0, size = 10, sort } = params;
  const { data } = await apiClient.get<PageConsultantSummaryDto>('/api/consultants', {
    params: { name, page, size, sort }
  });
  return data;
}

export interface ConsultantSyncResponse { [key: string]: unknown }

export async function runConsultantSync(batchSize = 100): Promise<ConsultantSyncResponse> {
  const { data } = await apiClient.post<ConsultantSyncResponse>('/api/consultants/sync/run', null, { params: { batchSize } });
  return data;
}