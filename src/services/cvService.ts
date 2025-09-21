import apiClient from './apiClient';
import type { CvData } from '../types/api';

export async function getCv(userId: string): Promise<CvData> {
  const { data } = await apiClient.get<CvData>(`/api/cv/${encodeURIComponent(userId)}`);
  return data;
}