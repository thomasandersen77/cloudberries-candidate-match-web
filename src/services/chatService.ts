import apiClient, {aiScoringClient} from './apiClient';
import type {AIAnalysisRequest, AIResponseModel, ChatSearchRequest, ChatSearchResponse} from '../types/api';

function getOrCreateConversationId(): string {
    const key = 'cb_chat_conversation_id';
    let id = localStorage.getItem(key);
    if (!id) { id = crypto.randomUUID(); localStorage.setItem(key, id); }
    return id;
}

export async function analyzeContent(payload: AIAnalysisRequest): Promise<AIResponseModel> {
    const cid = getOrCreateConversationId();
    const body: AIAnalysisRequest = { ...payload, conversationId: cid };
    const {data} = await apiClient.post<AIResponseModel>('/api/chatbot/analyze', body);
    return data;
}

// AI-powered consultant search
export async function searchChat(payload: ChatSearchRequest): Promise<ChatSearchResponse> {
    const {data} = await aiScoringClient.post<ChatSearchResponse>('/api/chatbot/search', payload);
    return data;
}
