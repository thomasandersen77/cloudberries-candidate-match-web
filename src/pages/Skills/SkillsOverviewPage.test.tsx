import React from 'react';
import { describe, expect, test, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import SkillsOverviewPage from './SkillsOverviewPage';

// Mock IntersectionObserver
Object.defineProperty(window, 'IntersectionObserver', {
  writable: true,
  value: vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    disconnect: vi.fn(),
    unobserve: vi.fn(),
  })),
});

vi.mock('../../services/skillsService', () => ({
  listSkills: vi.fn().mockResolvedValue([
    { name: 'JAVA', konsulenterMedSkill: 2, konsulenter: [{ userId: 'u1', name: 'Alice', email: 'a@b.com', bornYear: 1990, defaultCvId: 'cv1' }] },
    { name: 'KOTLIN', konsulenterMedSkill: 1, konsulenter: [{ userId: 'u2', name: 'Bob', email: 'b@c.com', bornYear: 1988, defaultCvId: 'cv2' }] }
  ]),
  listSkillSummary: vi.fn().mockResolvedValue({
    content: [
      { name: 'JAVA', consultantCount: 2 },
      { name: 'KOTLIN', consultantCount: 1 }
    ],
    number: 0,
    size: 20,
    totalElements: 2,
    totalPages: 1,
    first: true,
    last: true
  })
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