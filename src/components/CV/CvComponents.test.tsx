import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import CvSummary from './CvSummary';
import SkillsSection from './SkillsSection';
import WorkHistoryTable from './WorkHistoryTable';
import ProjectExperienceTable from './ProjectExperienceTable';
import type {
  KeyQualificationDto,
  SkillCategoryDto,
  WorkExperienceDto,
  ProjectExperienceDto
} from '../../types/api';

describe('CvSummary', () => {
  it('renders key qualifications', () => {
    const keyQualifications: KeyQualificationDto[] = [
      {
        label: 'Senior Developer',
        description: 'Experienced in full-stack development'
      },
      {
        label: 'Team Lead',
        description: 'Led a team of 5 developers'
      }
    ];

    render(<CvSummary keyQualifications={keyQualifications} />);

    expect(screen.getByText('Sammendrag')).toBeInTheDocument();
    expect(screen.getByText('Senior Developer')).toBeInTheDocument();
    expect(screen.getByText('Experienced in full-stack development')).toBeInTheDocument();
    expect(screen.getByText('Team Lead')).toBeInTheDocument();
    expect(screen.getByText('Led a team of 5 developers')).toBeInTheDocument();
  });

  it('renders empty state when no qualifications', () => {
    render(<CvSummary keyQualifications={[]} />);

    expect(screen.getByText('Sammendrag')).toBeInTheDocument();
    expect(screen.getByText('Ingen nøkkelkvalifikasjoner tilgjengelig')).toBeInTheDocument();
  });
});

describe('SkillsSection', () => {
  it('renders skills from categories and general skills', () => {
    const skillCategories: SkillCategoryDto[] = [
      {
        name: 'Programming Languages',
        skills: [
          { name: 'Java', durationYears: 5 },
          { name: 'TypeScript', durationYears: 3 }
        ]
      }
    ];

    const generalSkills = ['React', 'Node.js'];

    render(<SkillsSection skillCategories={skillCategories} skills={generalSkills} />);

    expect(screen.getByText('Ferdigheter')).toBeInTheDocument();
    expect(screen.getByText('Hovedferdigheter')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    expect(screen.getByText('Programming Languages')).toBeInTheDocument();
    expect(screen.getByText('Java (5 år)')).toBeInTheDocument();
    expect(screen.getByText('TypeScript (3 år)')).toBeInTheDocument();
  });

  it('renders empty state when no skills', () => {
    render(<SkillsSection skillCategories={[]} skills={[]} />);

    expect(screen.getByText('Ferdigheter')).toBeInTheDocument();
    expect(screen.getByText('Ingen ferdigheter tilgjengelig')).toBeInTheDocument();
  });
});

describe('WorkHistoryTable', () => {
  it('renders work experience in sorted order', () => {
    const workExperience: WorkExperienceDto[] = [
      {
        employer: 'Company A',
        fromYearMonth: '2020-01',
        toYearMonth: '2022-12'
      },
      {
        employer: 'Company B',
        fromYearMonth: '2023-01',
        toYearMonth: null // Current job
      }
    ];

    render(<WorkHistoryTable workExperience={workExperience} />);

    expect(screen.getByText('Arbeidshistorikk')).toBeInTheDocument();
    expect(screen.getByText('Company A')).toBeInTheDocument();
    expect(screen.getByText('Company B')).toBeInTheDocument();
    expect(screen.getByText('01/2020')).toBeInTheDocument();
    expect(screen.getByText('12/2022')).toBeInTheDocument();
    expect(screen.getByText('01/2023')).toBeInTheDocument();
    expect(screen.getByText('Pågående')).toBeInTheDocument();
  });

  it('renders empty state when no work experience', () => {
    render(<WorkHistoryTable workExperience={[]} />);

    expect(screen.getByText('Arbeidshistorikk')).toBeInTheDocument();
    expect(screen.getByText('Ingen arbeidserfaring tilgjengelig')).toBeInTheDocument();
  });
});

describe('ProjectExperienceTable', () => {
  it('renders project experience with skills', () => {
    const projectExperience: ProjectExperienceDto[] = [
      {
        customer: 'Client A',
        description: 'E-commerce platform development',
        fromYearMonth: '2022-01',
        toYearMonth: '2022-06',
        skills: ['React', 'Node.js', 'PostgreSQL'],
        roles: [
          {
            name: 'Frontend Developer',
            description: 'Developed user interface'
          }
        ]
      }
    ];

    render(<ProjectExperienceTable projectExperience={projectExperience} />);

    expect(screen.getByText('Prosjekterfaring')).toBeInTheDocument();
    expect(screen.getByText('Client A')).toBeInTheDocument();
    expect(screen.getByText('E-commerce platform development')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
    expect(screen.getByText('01/2022')).toBeInTheDocument();
    expect(screen.getByText('06/2022')).toBeInTheDocument();
  });

  it('limits skills display and shows expand option', () => {
    const projectExperience: ProjectExperienceDto[] = [
      {
        customer: 'Client A',
        description: 'Complex project',
        skills: ['React', 'Node.js', 'PostgreSQL', 'Docker', 'Kubernetes'],
        fromYearMonth: '2022-01',
        toYearMonth: '2022-06'
      }
    ];

    render(<ProjectExperienceTable projectExperience={projectExperience} />);

    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL')).toBeInTheDocument();
    expect(screen.getByText('+2 flere')).toBeInTheDocument();
  });

  it('renders empty state when no project experience', () => {
    render(<ProjectExperienceTable projectExperience={[]} />);

    expect(screen.getByText('Prosjekterfaring')).toBeInTheDocument();
    expect(screen.getByText('Ingen prosjekterfaring tilgjengelig')).toBeInTheDocument();
  });
});