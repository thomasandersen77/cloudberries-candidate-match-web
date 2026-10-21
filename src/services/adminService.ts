import apiClient from './apiClient';
import type { AnthropicUsageResponse, AiModelsResponse, CvReviewPrompt, CvScoreBasis, CvScoreBasisRow } from '../types/api';

export async function getAnthropicUsage(): Promise<AnthropicUsageResponse> {
  const { data } = await apiClient.get<AnthropicUsageResponse>('anthropic/usage');
  return data;
}

export async function getAiModels(): Promise<AiModelsResponse> {
  const { data } = await apiClient.get<AiModelsResponse>('admin/ai/models');
  return data;
}

/** Every stored CV score, newest first, with whether its basis was stored. */
export async function listCvScoreBases(): Promise<CvScoreBasisRow[]> {
  const { data } = await apiClient.get<CvScoreBasisRow[]>('admin/cv-score/basis');
  return data;
}

/** What one CV score rests on: criteria, deductions, the model's notes and counts of the CV. */
export async function getCvScoreBasis(candidateId: string): Promise<CvScoreBasis> {
  const { data } = await apiClient.get<CvScoreBasis>(`admin/cv-score/${encodeURIComponent(candidateId)}/basis`);
  return data;
}

/** The CV review prompt as it is sent, read only, with its version and the criteria weights. */
export async function getCvReviewPrompt(): Promise<CvReviewPrompt> {
  const { data } = await apiClient.get<CvReviewPrompt>('admin/cv-score/prompt');
  return data;
}
