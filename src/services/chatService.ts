import apiClient from './apiClient';
import type { AIAnalysisRequest, AIResponseModel } from '../types/api';

export async function analyzeContent(payload: AIAnalysisRequest): Promise<AIResponseModel> {
  const { data } = await apiClient.post<AIResponseModel>('/api/chatbot/analyze', payload);
  return data;
}