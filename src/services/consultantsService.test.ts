import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { RelationalSearchRequest, SemanticSearchRequest } from '../types/api';
import { 
  listConsultants,
  listConsultantsWithCv,
  listConsultantsWithCvPaged,
  runConsultantSync,
  syncSingleConsultant,
  searchConsultantsRelational,
  searchConsultantsSemantic,
  getEmbeddingInfo,
} from './consultantsService';
import apiClient from './apiClient';

// Mock the apiClient
vi.mock('./apiClient', () => {
  return {
    default: {
      get: vi.fn(),
      post: vi.fn(),
    },
    aiScoringClient: {
      get: vi.fn(),
      post: vi.fn(),
    },
  };
});
const mockedApiClient = vi.mocked(apiClient);
const { aiScoringClient: mockedAiClient } = await import('./apiClient');

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

      expect(mockedApiClient.get).toHaveBeenCalledWith('consultants', {
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

      expect(mockedApiClient.get).toHaveBeenCalledWith('consultants/with-cv', {
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

      expect(mockedApiClient.get).toHaveBeenCalledWith('consultants/with-cv/paged', {
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

(mockedAiClient.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue(mockResponse);

      const result = await runConsultantSync(100);

expect((mockedAiClient.post as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
        'consultants/sync/run',
        null,
        { params: { batchSize: 100 } }
      );
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('syncSingleConsultant', () => {
    it('calls the endpoint for one consultant, not the full run with batchSize 1', async () => {
      const data = { total: 1, attempted: 1, succeeded: 1, failed: 0, skipped: 0, created: 0, updated: 1 };
      (mockedAiClient.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data });

      const result = await syncSingleConsultant('123', 'cv123');

      const post = mockedAiClient.post as unknown as ReturnType<typeof vi.fn>;
      expect(post).toHaveBeenCalledTimes(1);
      expect(post.mock.calls[0][0]).toBe('consultants/sync/123/cv123');
      expect(post).not.toHaveBeenCalledWith('consultants/sync/run', expect.anything(), expect.anything());
      expect(result).toEqual(data);
    });

    it('encodes the ids into the path', async () => {
      (mockedAiClient.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValue({ data: {} });

      await syncSingleConsultant('a/b', 'c d');

      const post = mockedAiClient.post as unknown as ReturnType<typeof vi.fn>;
      expect(post.mock.calls[0][0]).toBe('consultants/sync/a%2Fb/c%20d');
    });
  });

  describe('search endpoints', () => {
    it('searchConsultantsRelational posts body with pagination and returns page dto', async () => {
      const pagePayload = {
        content: [
          { userId: 'u1', name: 'Alice', cvId: 'cv1', skills: [], cvs: [{ active: true }] }
        ],
        number: 0,
        size: 10,
        totalElements: 1,
        totalPages: 1,
        first: true,
        last: true,
        sort: {},
        pageable: {}
      };
(mockedApiClient.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: pagePayload });

      const relReq: RelationalSearchRequest = { name: 'Alice', skillsAll: ['JAVA'], skillsAny: [], onlyActiveCv: true };
      const res = await searchConsultantsRelational({
        request: relReq,
        page: 0,
        size: 10
      });

expect(mockedApiClient.post).toHaveBeenCalledWith(
        'consultants/search',
        { name: 'Alice', skillsAll: ['JAVA'], skillsAny: [], onlyActiveCv: true, pagination: { page: 0, size: 10 } }
      );
      expect(res).toEqual(pagePayload);
    });

    it('searchConsultantsSemantic posts body with pagination and returns page dto (aiScoringClient)', async () => {
      const pagePayload = {
        content: [],
        number: 0,
        size: 20,
        totalElements: 0,
        totalPages: 0,
        first: true,
        last: true,
        sort: {},
        pageable: {}
      };
(mockedAiClient.post as unknown as ReturnType<typeof vi.fn>).mockResolvedValueOnce({ data: pagePayload });

      const semReq: SemanticSearchRequest = { text: 'Senior Java developer', topK: 10, onlyActiveCv: true };
      const res = await searchConsultantsSemantic({
        request: semReq,
        page: 0,
        size: 20
      });

expect((mockedAiClient.post as unknown as ReturnType<typeof vi.fn>)).toHaveBeenCalledWith(
        'consultants/search/semantic',
        { text: 'Senior Java developer', topK: 10, onlyActiveCv: true, pagination: { page: 0, size: 20 } }
      );
      expect(res).toEqual(pagePayload);
    });

    it('getEmbeddingInfo returns provider info', async () => {
      const payload = { enabled: true, provider: 'GOOGLE_GEMINI', model: 'text-embedding-004', dimension: 768 };
      mockedApiClient.get.mockResolvedValueOnce({ data: payload });
      const res = await getEmbeddingInfo();
      expect(mockedApiClient.get).toHaveBeenCalledWith('consultants/search/embedding-info');
      expect(res).toEqual(payload);
    });
  });

});