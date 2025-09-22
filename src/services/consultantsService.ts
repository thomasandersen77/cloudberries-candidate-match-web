import apiClient from './apiClient';
import type {PageConsultantSummaryDto} from '../types/api';

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
    [key: string]: unknown
}

export async function runConsultantSync(batchSize = 120): Promise<ConsultantSyncResponse> {
    const {data} = await apiClient.post<ConsultantSyncResponse>('/api/consultants/sync/run', null, {params: {batchSize}});
    return data;
}
