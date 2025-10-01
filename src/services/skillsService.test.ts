import { expect, test, vi, beforeEach } from 'vitest';
import * as api from './apiClient';
import { listSkills } from './skillsService';
import type { SkillInCompanyDto } from '../types/api';

vi.mock('./apiClient', () => {
  return {
    default: {
      get: vi.fn(),
    }
  };
});

const mockGet = (api.default.get as unknown as ReturnType<typeof vi.fn>);

beforeEach(() => {
  mockGet.mockReset();
});

test('listSkills sorts by konsulenterMedSkill desc', async () => {
  const payload: SkillInCompanyDto[] = [
    { name: 'KOTLIN', konsulenterMedSkill: 1, konsulenter: [] },
    { name: 'JAVA', konsulenterMedSkill: 3, konsulenter: [] },
    { name: 'REACT', konsulenterMedSkill: 2, konsulenter: [] },
  ];
  mockGet.mockResolvedValueOnce({ data: payload });
  const res = await listSkills();
  expect(res.map(s => s.name)).toEqual(['JAVA', 'REACT', 'KOTLIN']);
});