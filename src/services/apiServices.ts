import axios from 'axios';

/**
 * Oppretter en sentralisert axios-klient.
 * Dette gjør det enkelt å sette felles konfigurasjon som baseURL,
 * timeout, og fremtidige interceptors for f.eks. autentisering.
 */
const apiClient = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080',
    timeout: 5000, // 5 sekunder timeout
});

/**
 * Henter helsestatus fra backend.
 * Denne funksjonen returnerer en Promise som resolverer til status-strengen (f.eks. "UP").
 * @returns {Promise<string>} Statusen fra backend.
 * @throws {Error} kastes hvis nettverkskallet feiler eller status ikke er 'UP'.
 */
export const getHealthStatus = async (): Promise<string> => {
    const response = await apiClient.get('/api/health');
    if (response.status !== 200 || response.data?.status !== 'UP') {
        throw new Error('Backend service is not healthy');
    }
    return response.data.status;
};

// Fremtidige API-kall kan legges til her:
// export const getCandidates = async (projectId) => { ... };