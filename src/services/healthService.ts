import apiClient from './apiClient';

// Interface for den detaljerte helsestatusen til hver avhengighet
import type {HealthResponse as HealthStatus} from '../types/api';

export interface HealthDetails {
    database?: 'UP' | 'DOWN';
    flowcase?: 'UP' | 'DOWN';
    genAI_operational?: 'UP' | 'DOWN';
    genAI_configured?: 'UP' | 'DOWN';
}

// En standard "NEDE"-status som brukes ved feil.
const defaultDownStatus: HealthStatus = {
    status: 'DOWN',
    details: {
        database: 'DOWN',
        flowcase: 'DOWN',
        genAI_operational: 'DOWN',
        genAI_configured: 'DOWN',
    },
} as unknown as HealthStatus;

/**
 * Henter den detaljerte helsestatusen fra backend.
 * @returns En Promise som resolverer til et HealthStatus-objekt.
 */
export const getHealthStatus = async (): Promise<HealthStatus> => {
    // Try primary path from OpenAPI
    try {
        const response = await apiClient.get<HealthStatus>('health');
        if (response.data && response.data.status) {
            return response.data;
        }
    } catch (error) {
        // fall through to fallback paths
    }

    // Fallback to Spring Boot Actuator
    try {
        const {data} = await apiClient.get<any>('/actuator/health');
        if (data && data.status) {
            const details = data.details ?? data.components ?? {};
            return {status: data.status, details} as HealthStatus;
        }
    } catch (error) {
        // continue
    }


    return defaultDownStatus;
};

/**
 * Fetches the health status from the backend API.
 * This is a mock implementation. Replace with a real API call.
 */
export const getHealthStatusMock = async (): Promise<{
    status: string;
    details: { database: boolean; flowcase: boolean; genAI_operational: boolean; genAI_configured: boolean }
}> => {
    // Simulating a network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Mock data matching your server's response format
    const mockResponse = {
        status: "UP",
        details: {
            database: true,
            flowcase: true,
            genAI_operational: false,
            genAI_configured: true
        }
    };

    // In a real application, you would use axios here:
    // const response = await axios.get<HealthStatus>('/api/health');
    // return response.data;

    return mockResponse;
};
