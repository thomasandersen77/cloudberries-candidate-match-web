import React from 'react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SkillsOverviewPage from './SkillsOverviewPage';

vi.mock('../../services/skillsService', () => ({
  listSkills: vi.fn().mockResolvedValue([
    { name: 'JAVA', konsulenterMedSkill: 2, konsulenter: [{ userId: 'u1', name: 'Alice', email: 'a@b.com', bornYear: 1990, defaultCvId: 'cv1' }] },
    { name: 'KOTLIN', konsulenterMedSkill: 1, konsulenter: [{ userId: 'u2', name: 'Bob', email: 'b@c.com', bornYear: 1988, defaultCvId: 'cv2' }] }
  ])
}));

describe('SkillsOverviewPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders skills and counts', async () => {
    render(
      <MemoryRouter>
        <SkillsOverviewPage />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByText('JAVA')).toBeInTheDocument();
      expect(screen.getByText('KOTLIN')).toBeInTheDocument();
      expect(screen.getAllByText(/konsulenter$/i)[0]).toBeInTheDocument();
    });
  });
});