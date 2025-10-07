import apiClient, {aiScoringClient} from './apiClient';
import type {AIAnalysisRequest, AIResponseModel, ChatSearchRequest, ChatSearchResponse} from '../types/api';

export async function analyzeContent(payload: AIAnalysisRequest): Promise<AIResponseModel> {
    const body: AIAnalysisRequest = { ...payload };
    const {data} = await apiClient.post<AIResponseModel>('chatbot/analyze', body);
    return data;
}

// AI-powered consultant search
export async function searchChat(payload: ChatSearchRequest): Promise<ChatSearchResponse> {
    const {data} = await aiScoringClient.post<ChatSearchResponse>('chatbot/search', payload);
    return data;
}
