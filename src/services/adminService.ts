import apiClient from './apiClient';
import type { AnthropicUsageResponse } from '../types/api';

export async function getAnthropicUsage(): Promise<AnthropicUsageResponse> {
  const { data } = await apiClient.get<AnthropicUsageResponse>('admin/anthropic-usage');
  return data;
}
