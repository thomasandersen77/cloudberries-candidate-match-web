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

type LegacyPageShape = {
    content?: ConsultantSummaryDto[];
    page?: { number?: number; size?: number; totalElements?: number; totalPages?: number };
};

function normalizePageDto(data: unknown): PageConsultantSummaryDto {
    // Supports both legacy top-level page fields and Spring Data Web VIA_DTO format (page: { ... })
    if (data && typeof data === 'object' && 'page' in data) {
        const legacy = data as LegacyPageShape;
        const p = legacy.page ?? {};
        const number = Number(p.number ?? 0);
        const size = Number(p.size ?? (Array.isArray(legacy.content) ? legacy.content.length : 0));
        const totalElements = Number(p.totalElements ?? 0);
        const totalPages = Number(p.totalPages ?? (size > 0 ? Math.ceil(totalElements / size) : 0));
        const first = number === 0;
        const last = totalPages ? number >= totalPages - 1 : false;
        return {
            content: legacy.content ?? [],
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
    const {data} = await apiClient.get<PageConsultantSummaryDto>('consultants', {
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
    const {data} = await aiScoringClient.post<ConsultantSyncResponse>('consultants/sync/run', null, {params: {batchSize}});
    return data;
}

// New CV-related endpoints
export async function listConsultantsWithCv(onlyActiveCv = false): Promise<ConsultantWithCvDto[]> {
    // Normalize to array to prevent .filter/.map TypeErrors when backend returns a paged object
    const { data } = await apiClient.get<unknown>('consultants/with-cv', {
        params: { onlyActiveCv }
    });
    if (Array.isArray(data)) {
        return data as ConsultantWithCvDto[];
    }
    if (data && typeof data === 'object') {
        const obj = data as { content?: unknown; items?: unknown };
        const items = (Array.isArray(obj.content) ? obj.content : undefined)
            ?? (Array.isArray(obj.items) ? obj.items : undefined);
        if (Array.isArray(items)) {
            return items as ConsultantWithCvDto[];
        }
    }
    return [];
}

export async function listConsultantsWithCvPaged(params: {
    onlyActiveCv?: boolean;
    page?: number;
    size?: number;
    sort?: string[]
} = {}): Promise<PageConsultantWithCvDto> {
    const {onlyActiveCv = false, page = 0, size = 20, sort} = params;
    const {data} = await apiClient.get<PageConsultantWithCvDto>('consultants/with-cv/paged', {
        params: {onlyActiveCv, page, size, sort}
    });
    return data;
}

export async function listConsultantCvs(userId: string): Promise<ConsultantCvDto[]> {
    const { data } = await apiClient.get<ConsultantCvDto[]>(`consultants/${encodeURIComponent(userId)}/cvs`);
    return data;
}

export async function getConsultantByUserId(userId: string): Promise<ConsultantSummaryDto> {
    const { data } = await apiClient.get<ConsultantSummaryDto>(`consultants/${encodeURIComponent(userId)}`);
    return data;
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
}): Promise<PageConsultantWithCvDto> {
    const { request, page = 0, size = 20, sort } = params;
    const body: RelationalSearchRequest = {
        ...request,
        pagination: {
            page,
            size,
            ...(sort ? { sort } : {})
        }
    };
    const { data } = await apiClient.post<PageConsultantWithCvDto>('consultants/search', body);
    return data;
}

export async function searchConsultantsSemantic(params: {
    request: SemanticSearchRequest;
    page?: number;
    size?: number;
    sort?: string[];
}): Promise<PageConsultantWithCvDto> {
    const { request, page = 0, size = 20, sort } = params;
    const body: SemanticSearchRequest = {
        ...request,
        pagination: {
            page,
            size,
            ...(sort ? { sort } : {})
        }
    } as SemanticSearchRequest;
    const { data } = await aiScoringClient.post<PageConsultantWithCvDto>(
        'consultants/search/semantic',
        body
    );
    return data;
}

export async function getEmbeddingInfo(): Promise<EmbeddingProviderInfo> {
    const { data } = await apiClient.get<EmbeddingProviderInfo>('consultants/search/embedding-info');
    return data;
}

// Note: Single consultant sync endpoint may not exist in OpenAPI spec
// This function may need to be removed or the endpoint added to backend
export async function syncSingleConsultant(
    userId: string, 
    cvId: string
): Promise<ConsultantSyncSingleResponse> {
    const {data} = await aiScoringClient.post<ConsultantSyncSingleResponse>(
        `consultants/sync/${userId}/${cvId}`
    );
    return data;
}
