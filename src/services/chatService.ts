import apiClient, { aiScoringClient } from './apiClient';
import type {
  AIAnalysisRequest,
  AIResponseModel,
  ChatSearchRequest,
  ChatSearchResponse,
  RagChatRequest,
  RagChatResponse,
  RagIngestRequest,
  RagIngestResponse,
  RagIngestDbResponse,
} from '../types/api';

export async function analyzeContent(payload: AIAnalysisRequest): Promise<AIResponseModel> {
  const body: AIAnalysisRequest = { ...payload };
  const { data } = await aiScoringClient.post<AIResponseModel>('chatbot/analyze', body);
  return data;
}

/** Legacy: chatbot/search is not in OpenAPI spec */
export async function searchChat(payload: ChatSearchRequest): Promise<ChatSearchResponse> {
  const { data } = await aiScoringClient.post<ChatSearchResponse>('chatbot/search', payload);
  return data;
}

export async function ragChat(payload: RagChatRequest): Promise<RagChatResponse> {
  const { data } = await aiScoringClient.post<RagChatResponse>('rag/chat', payload);
  return data;
}

export async function ragIngest(payload: RagIngestRequest): Promise<RagIngestResponse> {
  const { data } = await apiClient.post<RagIngestResponse>('rag/ingest', payload);
  return data;
}

export async function ragIngestFromDb(): Promise<RagIngestDbResponse> {
  const { data } = await aiScoringClient.post<RagIngestDbResponse>('rag/ingest/db');
  return data;
}
