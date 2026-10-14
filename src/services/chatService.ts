import { aiScoringClient } from './apiClient';
import type {
  ChatAskRequest,
  ChatAskResponse,
  ChatSearchRequest,
  ChatSearchResponse,
} from '../types/api';

/**
 * Ett spørsmål til den forankrede chatten.
 *
 * Utelat conversationId for å starte en samtale; send tilbake den serveren returnerer for å
 * fortsette den. Svaret bærer kildene det hvilte på, så de kan vises uten å tolke svarteksten.
 */
export async function askAssistant(payload: ChatAskRequest): Promise<ChatAskResponse> {
  const { data } = await aiScoringClient.post<ChatAskResponse>('chatbot/ask', payload);
  return data;
}

/** Sletter turene og hva samtalen handlet om, på serveren. */
export async function clearConversation(conversationId: string): Promise<void> {
  await aiScoringClient.delete(`chatbot/ask/${encodeURIComponent(conversationId)}`);
}

/** The advanced search tab. Now in the root OpenAPI spec; ChatSearchTab is its only caller. */
export async function searchChat(payload: ChatSearchRequest): Promise<ChatSearchResponse> {
  const { data } = await aiScoringClient.post<ChatSearchResponse>('chatbot/search', payload);
  return data;
}
