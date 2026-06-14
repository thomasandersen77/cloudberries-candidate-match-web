import apiClient from './apiClient';
import type { AnthropicUsageResponse, AiModelsResponse } from '../types/api';

export async function getAnthropicUsage(): Promise<AnthropicUsageResponse> {
  const { data } = await apiClient.get<AnthropicUsageResponse>('admin/anthropic-usage');
  return data;
}

export async function getAiModels(): Promise<AiModelsResponse> {
  const { data } = await apiClient.get<AiModelsResponse>('admin/ai/models');
  return data;
}
