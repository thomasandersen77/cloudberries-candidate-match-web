import apiClient, { aiScoringClient } from './apiClient';
import type {
    PageConsultantSummaryDto,
    ConsultantWithCvDto,
    PageConsultantWithCvDto,
    RelationalSearchRequest,
    SemanticSearchRequest,
    EmbeddingProviderInfo,
    ConsultantCvDto,
    ConsultantSummaryDto,
} from '../types/api';

function normalizePageDto(data: any): PageConsultantSummaryDto {
    // Supports both legacy top-level page fields and Spring Data Web VIA_DTO format (page: { ... })
    if (data && typeof data === 'object' && 'page' in data) {
        const p = (data as any).page ?? {};
        const number = Number(p.number ?? 0);
        const size = Number(p.size ?? (Array.isArray((data as any).content) ? (data as any).content.length : 0));
        const totalElements = Number(p.totalElements ?? 0);
        const totalPages = Number(p.totalPages ?? (size > 0 ? Math.ceil(totalElements / size) : 0));
        const first = number === 0;
        const last = totalPages ? number >= totalPages - 1 : false;
        return {
            content: (data as any).content ?? [],
            number,
            size,
            totalElements,
            totalPages,
            first,
            last,
            sort: {},
            pageable: {},
        };
    }
    return data as PageConsultantSummaryDto;
}

export async function listConsultants(params: {
    name?: string;
    page?: number;
    size?: number;
    sort?: string[]
} = {}): Promise<PageConsultantSummaryDto> {
    const {name, page = 0, size = 100, sort} = params;
    const {data} = await apiClient.get('/api/consultants', {
        params: {name, page, size, sort}
    });
    return normalizePageDto(data);
}

export interface ConsultantSyncResponse {
    total?: number;
    succeeded?: number;
    failed?: number;
    [key: string]: unknown;
}

export async function runConsultantSync(batchSize = 120): Promise<ConsultantSyncResponse> {
    const {data} = await aiScoringClient.post<ConsultantSyncResponse>('/api/consultants/sync/run', null, {params: {batchSize}});
    return data;
}

// New CV-related endpoints
export async function listConsultantsWithCv(onlyActiveCv = false): Promise<ConsultantWithCvDto[]> {
    const {data} = await apiClient.get('/api/consultants/with-cv', {
        params: {onlyActiveCv}
    });
    return data;
}

export async function listConsultantsWithCvPaged(params: {
    onlyActiveCv?: boolean;
    page?: number;
    size?: number;
    sort?: string[]
} = {}): Promise<PageConsultantWithCvDto> {
    const {onlyActiveCv = false, page = 0, size = 20, sort} = params;
    const {data} = await apiClient.get('/api/consultants/with-cv/paged', {
        params: {onlyActiveCv, page, size, sort}
    });
    return data;
}

export async function listConsultantCvs(userId: string): Promise<ConsultantCvDto[]> {
    const { data } = await apiClient.get(`/api/consultants/${encodeURIComponent(userId)}/cvs`);
    return data as ConsultantCvDto[];
}

export async function getConsultantByUserId(userId: string): Promise<ConsultantSummaryDto> {
    const { data } = await apiClient.get(`/api/consultants/${encodeURIComponent(userId)}`);
    return data as ConsultantSummaryDto;
}

export interface ConsultantSyncSingleResponse {
    userId: string;
    cvId: string;
    processed: boolean;
    message?: string;
}

// Search endpoints
export async function searchConsultantsRelational(params: {
    request: RelationalSearchRequest;
    page?: number;
    size?: number;
    sort?: string[]
} = { request: {} as RelationalSearchRequest }): Promise<PageConsultantWithCvDto> {
    const { request, page = 0, size = 20, sort } = params;
    const body = {
        ...(request as any),
        pagination: {
            page,
            size,
            ...(sort ? { sort } : {})
        }
    };
    const { data } = await apiClient.post<PageConsultantWithCvDto>('/api/consultants/search', body);
    return data;
}

export async function searchConsultantsSemantic(params: {
    request: SemanticSearchRequest;
    page?: number;
    size?: number;
    sort?: string[];
}): Promise<PageConsultantWithCvDto> {
    const { request, page = 0, size = 20, sort } = params;
    const body = {
        ...(request as any),
        pagination: {
            page,
            size,
            ...(sort ? { sort } : {})
        }
    };
    const { data } = await aiScoringClient.post<PageConsultantWithCvDto>(
        '/api/consultants/search/semantic',
        body
    );
    return data;
}

export async function getEmbeddingInfo(): Promise<EmbeddingProviderInfo> {
    const { data } = await apiClient.get<EmbeddingProviderInfo>('/api/consultants/search/embedding-info');
    return data;
}

// Note: Single consultant sync endpoint may not exist in OpenAPI spec
// This function may need to be removed or the endpoint added to backend
export async function syncSingleConsultant(
    userId: string, 
    cvId: string
): Promise<ConsultantSyncSingleResponse> {
    const {data} = await aiScoringClient.post<ConsultantSyncSingleResponse>(
        `/api/consultants/sync/${userId}/${cvId}`
    );
    return data;
}
