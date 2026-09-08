import apiClient, { aiScoringClient } from './apiClient';
import type {
  ChatAnalyzeRequest,
  ChatAnalyzeResponse,
  ChatSearchRequest,
  ChatSearchResponse,
  RagChatRequest,
  RagChatResponse,
  RagIngestRequest,
  RagIngestResponse,
  RagIngestDbResponse,
} from '../types/api';

/**
 * Ett spørsmål til den forankrede chatten.
 *
 * Utelat conversationId for å starte en samtale; send tilbake den serveren returnerer for å
 * fortsette den. Svaret bærer kildene det hvilte på, så de kan vises uten å tolke svarteksten.
 */
export async function analyzeContent(payload: ChatAnalyzeRequest): Promise<ChatAnalyzeResponse> {
  const { data } = await aiScoringClient.post<ChatAnalyzeResponse>('chatbot/analyze', payload);
  return data;
}

/** Sletter turene og hva samtalen handlet om, på serveren. */
export async function clearAnalyzeConversation(conversationId: string): Promise<void> {
  await aiScoringClient.delete(`chatbot/analyze/${encodeURIComponent(conversationId)}`);
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
