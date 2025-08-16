import axios from 'axios';

// The updated URL to your backend's health endpoint
const API_URL = 'http://localhost:8080/api/health';

// Interface for the detailed health check status of each component
export interface HealthDetails {
    database: string;
    flowcase: string;
    genAI_operational: string;
    genAI_configured: string;
}

// Interface for the overall health status response
export interface HealthStatus {
    status: 'UP' | 'DOWN';
    details: HealthDetails;
}

// A default "DOWN" status to be used in case of an error
const defaultDownStatus: HealthStatus = {
    status: 'DOWN',
    details: {
        database: 'DOWN',
        flowcase: 'DOWN',
        genAI_operational: 'DOWN',
        genAI_configured: 'DOWN',
    },
};

/**
 * Fetches the detailed health status from the backend.
 * @returns A promise that resolves to a HealthStatus object.
 */
export const getHealthStatus = async (): Promise<HealthStatus> => {
    try {
        const response = await axios.get<HealthStatus>(API_URL);
        // Validate that the response contains the expected structure
        if (response.data && response.data.status && response.data.details) {
            return response.data;
        }
        // Return a default "DOWN" status if the response is malformed
        return defaultDownStatus;
    } catch (error) {
        console.error('Error fetching health status:', error);
        // Return a default "DOWN" status if the request fails
        return defaultDownStatus;
    }
};