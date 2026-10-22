import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getProjectRequestById } from './projectRequestsService';
import apiClient from './apiClient';

vi.mock('./apiClient', () => ({
  default: { get: vi.fn(), post: vi.fn(), delete: vi.fn() },
  aiScoringClient: { get: vi.fn(), post: vi.fn() }
}));
const mockedApiClient = vi.mocked(apiClient);

/**
 * What survives the trip from the API to the screen.
 *
 * The response is normalised on the way through, and the normaliser rebuilds each requirement from
 * the fields it knows about. It knew name and details, so appliesTo was dropped: the API said
 * eleven of request 8's requirements were the supplier's, and the page had no way to tell a
 * submission deadline from a competence demand. Nothing failed, because the shape it rebuilt them
 * into was declared by hand alongside the generated one rather than taken from it.
 */
describe('projectRequestsService', () => {
  beforeEach(() => vi.clearAllMocks());

  it('keeps who each requirement applies to', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        id: 8,
        customerName: 'Skatteetaten',
        title: 'Forespørsel om konsulentoppdrag',
        mustRequirements: [
          { name: 'Bred erfaring med Kotlin', details: null, appliesTo: 'CONSULTANT' },
          { name: 'Tilbudet skal leveres via Mercell TendSign', details: null, appliesTo: 'SUPPLIER' }
        ],
        shouldRequirements: [
          { name: 'Erfaring fra offentlig sektor', details: null, appliesTo: 'CONSULTANT' }
        ]
      }
    } as never);

    const dto = await getProjectRequestById(8);

    expect(dto?.mustRequirements?.map(r => r.appliesTo)).toEqual(['CONSULTANT', 'SUPPLIER']);
    expect(dto?.shouldRequirements?.map(r => r.appliesTo)).toEqual(['CONSULTANT']);
  });

  /**
   * Rows from before the distinction existed are the consultant's, which is how they were treated
   * when that was the only thing they could be.
   */
  it('reads a requirement without a subject as the consultant’s', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        id: 3,
        customerName: 'Oslo kommune',
        mustRequirements: [{ name: 'Java', details: null }],
        shouldRequirements: []
      }
    } as never);

    const dto = await getProjectRequestById(3);

    expect(dto?.mustRequirements?.[0].appliesTo).toBe('CONSULTANT');
  });

  /** The legacy shape is a list of strings, and a string says nothing about who has to satisfy it. */
  it('reads the legacy string list as the consultant’s requirements', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        id: 4,
        customerName: 'Entur AS',
        requiredSkills: ['Kotlin og Spring Boot', 'Bør ha erfaring med Kafka']
      }
    } as never);

    const dto = await getProjectRequestById(4);

    expect(dto?.mustRequirements?.map(r => r.appliesTo)).toEqual(['CONSULTANT']);
    expect(dto?.shouldRequirements?.map(r => r.appliesTo)).toEqual(['CONSULTANT']);
  });

  /**
   * The same rebuild dropped every field it did not name: the analysis status and its error, the
   * request's status, the role and the period. The page then could not say that a document's
   * requirements were never read, and the period line under «Avropet» never showed.
   */
  it('keeps every field the server sent, not only the ones the normaliser names', async () => {
    mockedApiClient.get.mockResolvedValue({
      data: {
        id: 9011, customerName: 'NAV', title: 'Tech lead', status: 'OPEN', role: 'Tech lead',
        startDate: '2026-11-01T00:00:00', endDate: '2027-10-31T00:00:00',
        analysisStatus: 'FAILED', analysisError: 'Kravtolkingen feilet hos AI-tjenesten.',
        mustRequirements: [], shouldRequirements: [],
      }
    } as never);

    const dto = await getProjectRequestById(9011);

    expect(dto).toMatchObject({
      status: 'OPEN', role: 'Tech lead', startDate: '2026-11-01T00:00:00', endDate: '2027-10-31T00:00:00',
      analysisStatus: 'FAILED', analysisError: 'Kravtolkingen feilet hos AI-tjenesten.',
    });
  });
});

