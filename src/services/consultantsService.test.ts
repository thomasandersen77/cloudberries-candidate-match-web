import { describe, it, expect, vi, beforeEach } from 'vitest';
import { 
  listConsultants,
  listConsultantsWithCv,
  listConsultantsWithCvPaged,
  runConsultantSync,
  syncSingleConsultant 
} from './consultantsService';
import apiClient from './apiClient';

// Mock the apiClient
vi.mock('./apiClient');
const mockedApiClient = vi.mocked(apiClient);

describe('consultantsService', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  describe('listConsultants', () => {
    it('should fetch consultants successfully', async () => {
      const mockResponse = {
        data: {
          content: [
            {
              userId: '123',
              name: 'John Doe',
              email: 'john@example.com',
              bornYear: 1990,
              defaultCvId: 'cv123'
            }
          ],
          number: 0,
          size: 10,
          totalElements: 1,
          totalPages: 1,
          first: true,
          last: true,
          sort: {},
          pageable: {}
        }
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      const result = await listConsultants({ name: 'John', page: 0, size: 10 });

      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/consultants', {
        params: { name: 'John', page: 0, size: 10, sort: undefined }
      });
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle legacy page structure', async () => {
      const mockResponse = {
        data: {
          content: [],
          page: {
            number: 0,
            size: 10,
            totalElements: 0,
            totalPages: 0
          }
        }
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      const result = await listConsultants();

      expect(result).toHaveProperty('number', 0);
      expect(result).toHaveProperty('size', 10);
      expect(result).toHaveProperty('totalElements', 0);
    });
  });

  describe('listConsultantsWithCv', () => {
    it('should fetch consultants with CV data', async () => {
      const mockResponse = {
        data: [
          {
            userId: '123',
            name: 'John Doe',
            cvId: 'cv123',
            skills: ['Java', 'React'],
            cvs: [
              {
                active: true,
                qualityScore: 85,
                keyQualifications: [
                  { label: 'Senior Developer', description: 'Experienced developer' }
                ]
              }
            ]
          }
        ]
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      const result = await listConsultantsWithCv(true);

      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/consultants/with-cv', {
        params: { onlyActiveCv: true }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('listConsultantsWithCvPaged', () => {
    it('should fetch paged consultants with CV data', async () => {
      const mockResponse = {
        data: {
          content: [],
          number: 0,
          size: 20,
          totalElements: 0,
          totalPages: 0,
          first: true,
          last: true
        }
      };

      mockedApiClient.get.mockResolvedValue(mockResponse);

      const result = await listConsultantsWithCvPaged({
        onlyActiveCv: false,
        page: 0,
        size: 20
      });

      expect(mockedApiClient.get).toHaveBeenCalledWith('/api/consultants/with-cv/paged', {
        params: { onlyActiveCv: false, page: 0, size: 20, sort: undefined }
      });
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('runConsultantSync', () => {
    it('should trigger consultant sync', async () => {
      const mockResponse = {
        data: {
          total: 10,
          succeeded: 9,
          failed: 1
        }
      };

      mockedApiClient.post.mockResolvedValue(mockResponse);

      const result = await runConsultantSync(100);

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/api/consultants/sync/run',
        null,
        { params: { batchSize: 100 } }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('syncSingleConsultant', () => {
    it('should sync single consultant', async () => {
      const mockResponse = {
        data: {
          userId: '123',
          cvId: 'cv123',
          processed: true
        }
      };

      mockedApiClient.post.mockResolvedValue(mockResponse);

      const result = await syncSingleConsultant('123', 'cv123');

      expect(mockedApiClient.post).toHaveBeenCalledWith(
        '/api/consultants/sync/123/cv123'
      );
      expect(result).toEqual(mockResponse.data);
    });

    it('should handle sync failure', async () => {
      const mockError = new Error('Sync failed');
      mockedApiClient.post.mockRejectedValue(mockError);

      await expect(syncSingleConsultant('123', 'cv123')).rejects.toThrow('Sync failed');
    });
  });
});