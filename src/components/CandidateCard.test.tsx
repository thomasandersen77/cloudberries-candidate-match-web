import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import '@testing-library/jest-dom/vitest';
import CandidateCard from './CandidateCard';
import type { ConsultantWithCvDto } from '../types/api';

// Mock useNavigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockConsultant: ConsultantWithCvDto = {
  id: 1,
  userId: 'user123',
  name: 'John Doe',
  cvId: 'cv123',
  skills: ['React', 'TypeScript', 'Node.js', 'AWS', 'Docker'],
  cvs: [
    {
      id: 1,
      active: true,
      qualityScore: 85,
      versionTag: 'v1.0',
      keyQualifications: [
        {
          label: 'Senior Developer',
          description: 'Experienced full-stack developer'
        }
      ],
      education: [],
      workExperience: [],
      projectExperience: [],
      certifications: [],
      courses: [],
      languages: [],
      skillCategories: [],
      attachments: []
    }
  ]
};

const renderWithRouter = (component: React.ReactElement) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  );
};

describe('CandidateCard', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('renders consultant information correctly', () => {
    renderWithRouter(<CandidateCard consultant={mockConsultant} />);

    expect(screen.getByText('John Doe')).toBeInTheDocument();
    expect(screen.getByText('Bruker-ID: user123')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('TypeScript')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    expect(screen.getByText('+2')).toBeInTheDocument(); // Shows +2 for remaining skills
  });

  it('displays quality score when available', () => {
    renderWithRouter(<CandidateCard consultant={mockConsultant} />);

    expect(screen.getAllByText('85%')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Kvalitet')[0]).toBeInTheDocument();
  });

  it('displays match percentage when provided', () => {
    renderWithRouter(
      <CandidateCard consultant={mockConsultant} matchPercentage={92} />
    );

    expect(screen.getByText('92%')).toBeInTheDocument();
    expect(screen.getByText('Match')).toBeInTheDocument();
  });

  it('navigates to consultant details when details button is clicked', () => {
    renderWithRouter(<CandidateCard consultant={mockConsultant} />);

    const detailsButton = screen.getAllByText('Se detaljer')[0];
    fireEvent.click(detailsButton);

    expect(mockNavigate).toHaveBeenCalledWith('/consultants/user123');
  });

  it('navigates to CV view when CV button is clicked', () => {
    renderWithRouter(<CandidateCard consultant={mockConsultant} />);

    const cvButton = screen.getAllByText('Se hele CV')[0];
    fireEvent.click(cvButton);

    expect(mockNavigate).toHaveBeenCalledWith('/cv/user123');
  });

  it('renders consultant with no active CV', () => {
    const consultantWithoutActiveCv: ConsultantWithCvDto = {
      ...mockConsultant,
      cvs: [
        {
          id: 1,
          active: false,
          qualityScore: null,
          versionTag: null,
          keyQualifications: [],
          education: [],
          workExperience: [],
          projectExperience: [],
          certifications: [],
          courses: [],
          languages: [],
          skillCategories: [],
          attachments: []
        }
      ]
    };

    renderWithRouter(<CandidateCard consultant={consultantWithoutActiveCv} />);

    expect(screen.getAllByText('0%')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Kvalitet')[0]).toBeInTheDocument();
  });

  it('renders consultant with no CVs', () => {
    const consultantWithoutCvs: ConsultantWithCvDto = {
      ...mockConsultant,
      cvs: []
    };

    renderWithRouter(<CandidateCard consultant={consultantWithoutCvs} />);

    expect(screen.getAllByText('0%')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Kvalitet')[0]).toBeInTheDocument();
  });

  it('handles consultant with few skills', () => {
    const consultantWithFewSkills: ConsultantWithCvDto = {
      ...mockConsultant,
      skills: ['React', 'TypeScript']
    };

    renderWithRouter(<CandidateCard consultant={consultantWithFewSkills} />);

    expect(screen.getAllByText('React')[0]).toBeInTheDocument();
    expect(screen.getAllByText('TypeScript')[0]).toBeInTheDocument();
    expect(screen.queryByText('+')).not.toBeInTheDocument();
  });

  it('renders consultant initial in avatar', () => {
    renderWithRouter(<CandidateCard consultant={mockConsultant} />);

    expect(screen.getAllByText('J')[0]).toBeInTheDocument(); // First letter of 'John Doe'
  });
});