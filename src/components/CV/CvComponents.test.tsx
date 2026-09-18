import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
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

    expect(screen.getAllByText('Sammendrag')[0]).toBeInTheDocument();
    expect(screen.getByText('Senior Developer')).toBeInTheDocument();
    expect(screen.getByText('Experienced in full-stack development')).toBeInTheDocument();
    expect(screen.getByText('Team Lead')).toBeInTheDocument();
    expect(screen.getByText('Led a team of 5 developers')).toBeInTheDocument();
  });

  it('renders empty state when no qualifications', () => {
    render(<CvSummary keyQualifications={[]} />);

    expect(screen.getAllByText('Sammendrag')[0]).toBeInTheDocument();
    expect(screen.getByText('Ingen nøkkelkvalifikasjoner tilgjengelig')).toBeInTheDocument();
  });

  /** Three CVs label their one key qualification "Sammendrag"; under the heading it read twice. */
  it('does not repeat the heading when Flowcase used it as the label', () => {
    render(<CvSummary keyQualifications={[{ label: 'Sammendrag', description: 'Senior utvikler.' }]} />);

    expect(screen.getAllByText('Sammendrag')).toHaveLength(1);
    expect(screen.getByText('Senior utvikler.')).toBeInTheDocument();
  });

  describe('clamped', () => {
    const long = 'Lang tekst. '.repeat(120);
    const sizes = { scrollHeight: 0, clientHeight: 0 };
    const define = (prop: 'scrollHeight' | 'clientHeight') =>
      Object.defineProperty(HTMLElement.prototype, prop, { configurable: true, get: () => sizes[prop] });
    const originals = {
      scrollHeight: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'scrollHeight'),
      clientHeight: Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'clientHeight'),
    };
    afterEach(() => {
      cleanup();
      for (const p of ['scrollHeight', 'clientHeight'] as const) {
        if (originals[p]) Object.defineProperty(HTMLElement.prototype, p, originals[p]!);
      }
    });

    it('cuts to the asked lines and offers the rest when the browser says text was cut', () => {
      sizes.scrollHeight = 400; sizes.clientHeight = 80; define('scrollHeight'); define('clientHeight');
      render(<CvSummary keyQualifications={[{ label: 'Profil', description: long }]} clampLines={4} />);

      const text = screen.getByText(long.trim());
      expect(text).toHaveStyle({ WebkitLineClamp: '4' });
      const more = screen.getByRole('button', { name: 'Vis mer' });
      fireEvent.click(more);
      expect(screen.getByText(long.trim())).not.toHaveStyle({ overflow: 'hidden' });
      expect(screen.getByRole('button', { name: 'Vis mindre' })).toBeInTheDocument();
    });

    it('shows no toggle when everything fits', () => {
      sizes.scrollHeight = 60; sizes.clientHeight = 60; define('scrollHeight'); define('clientHeight');
      render(<CvSummary keyQualifications={[{ label: 'Profil', description: 'Kort.' }]} clampLines={4} />);

      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });

    it('shows everything when no clamp was asked for', () => {
      render(<CvSummary keyQualifications={[{ label: 'Profil', description: long }]} />);
      expect(screen.getByText(long.trim())).not.toHaveStyle({ overflow: 'hidden' });
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
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

    expect(screen.getAllByText('Ferdigheter')[0]).toBeInTheDocument();
    expect(screen.getByText('Hovedferdigheter')).toBeInTheDocument();
    expect(screen.getByText('React')).toBeInTheDocument();
    expect(screen.getByText('Node.js')).toBeInTheDocument();
    expect(screen.getByText('Programming Languages')).toBeInTheDocument();
    expect(screen.getByText('Java (5 år)')).toBeInTheDocument();
    expect(screen.getByText('TypeScript (3 år)')).toBeInTheDocument();
  });

  it('renders empty state when no skills', () => {
    render(<SkillsSection skillCategories={[]} skills={[]} />);

    expect(screen.getAllByText('Ferdigheter')[0]).toBeInTheDocument();
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

    expect(screen.getAllByText('Arbeidshistorikk')[0]).toBeInTheDocument();
    const rows = screen.getAllByRole('row');
    expect(rows[1]).toHaveTextContent('Company B');
    expect(rows[2]).toHaveTextContent('Company A');
    expect(screen.getByText('01/2020')).toBeInTheDocument();
    expect(screen.getByText('12/2022')).toBeInTheDocument();
    expect(screen.getByText('01/2023')).toBeInTheDocument();
    expect(screen.getByText('Pågående')).toBeInTheDocument();
  });

  it('renders empty state when no work experience', () => {
    render(<WorkHistoryTable workExperience={[]} />);

    expect(screen.getAllByText('Arbeidshistorikk')[0]).toBeInTheDocument();
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

    expect(screen.getAllByText('Prosjekterfaring')[0]).toBeInTheDocument();
    expect(screen.getByText('Client A')).toBeInTheDocument();
    expect(screen.getByText('E-commerce platform development')).toBeInTheDocument();
    expect(screen.getAllByText('React')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Node.js')[0]).toBeInTheDocument();
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

    expect(screen.getAllByText('React')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Node.js')[0]).toBeInTheDocument();
    expect(screen.getAllByText('PostgreSQL')[0]).toBeInTheDocument();
    expect(screen.getByText('+2 flere')).toBeInTheDocument();
  });

  it('renders empty state when no project experience', () => {
    render(<ProjectExperienceTable projectExperience={[]} />);

    expect(screen.getAllByText('Prosjekterfaring')[0]).toBeInTheDocument();
    expect(screen.getByText('Ingen prosjekterfaring tilgjengelig')).toBeInTheDocument();
  });
});