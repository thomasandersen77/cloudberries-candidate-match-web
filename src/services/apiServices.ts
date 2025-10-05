import apiClient from './apiClient';

/**
 * Henter helsestatus fra backend (shared apiClient uses base '/api' and Vite proxy in dev).
 */

/**
 * Henter helsestatus fra backend.
 * Denne funksjonen returnerer en Promise som resolverer til status-strengen (f.eks. "UP").
 * @returns {Promise<string>} Statusen fra backend.
 * @throws {Error} kastes hvis nettverkskallet feiler eller status ikke er 'UP'.
 */
export const getHealthStatus = async (): Promise<string> => {
    const response = await apiClient.get('health');
    if (response.status !== 200 || response.data?.status !== 'UP') {
        throw new Error('Backend service is not healthy');
    }
    return response.data.status;
};

// Fremtidige API-kall kan legges til her:
// export const getCandidates = async (projectId) => { ... };