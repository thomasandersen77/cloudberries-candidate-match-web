import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import ConsultantSearchPage from '../ConsultantSearchPage';

vi.mock('../../../services/skillsService', () => ({
  listSkills: vi.fn().mockResolvedValue([
    { name: 'JAVA', konsulenterMedSkill: 2, konsulenter: [] },
    { name: 'KOTLIN', konsulenterMedSkill: 1, konsulenter: [] },
  ])
}));

vi.mock('../../../services/consultantsService', () => ({
  getEmbeddingInfo: vi.fn().mockResolvedValue({ enabled: true, provider: 'GOOGLE_GEMINI', model: 'text-embedding-004', dimension: 768 }),
  searchConsultantsRelational: vi.fn().mockResolvedValue({
    content: [ { userId: 'u1', name: 'Alice', cvId: 'cv1', skills: ['JAVA'], cvs: [{ active: true, qualityScore: 80 }] } ],
    number: 0, size: 10, totalElements: 1, totalPages: 1, first: true, last: true, sort: {}, pageable: {}
  }),
  searchConsultantsSemantic: vi.fn().mockResolvedValue({
    content: [], number: 0, size: 10, totalElements: 0, totalPages: 0, first: true, last: true, sort: {}, pageable: {}
  })
}));

describe('ConsultantSearchPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders both tabs and basic fields', async () => {
    render(
      <MemoryRouter>
        <ConsultantSearchPage />
      </MemoryRouter>
    );

    // Tabs
    expect(screen.getByText('Relasjonelt søk')).toBeInTheDocument();
    expect(screen.getByText('Semantisk søk')).toBeInTheDocument();

    // Relational fields
    await waitFor(() => {
      expect(screen.getByLabelText('Navn')).toBeInTheDocument();
    });

    // Trigger relational search
    fireEvent.click(screen.getByText('Søk'));

    await waitFor(() => {
      expect(screen.getByText('Alice')).toBeInTheDocument();
    });

    // Switch to semantic tab
    fireEvent.click(screen.getByText('Semantisk søk'));
    await waitFor(() => {
      expect(screen.getByText(/Om semantisk rangering/i)).toBeInTheDocument();
    });
  });
});
