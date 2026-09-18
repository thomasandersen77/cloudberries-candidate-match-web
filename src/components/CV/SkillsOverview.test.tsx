import React from 'react';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import SkillsOverview from './SkillsOverview';
import { countSkills, rankSkillsByDuration } from '../../utils/skillUtils';
import type { SkillCategoryDto } from '../../types/api';

afterEach(() => cleanup());

const categories: SkillCategoryDto[] = [
  { name: 'Databaser', skills: [{ name: 'PostgreSQL', durationYears: 10 }, { name: 'MySQL', durationYears: 7 }, { name: 'H2', durationYears: 8 }] },
  { name: 'Metodikk', skills: [{ name: 'Scrum', durationYears: 12 }, { name: 'Kanban', durationYears: 6 }] },
  { name: 'Modellering', skills: [{ name: 'Prosessmodellering' }, { name: 'UML', durationYears: 6 }] },
  { name: 'Programmeringsspråk', skills: [{ name: 'Java', durationYears: 20 }, { name: 'Kotlin', durationYears: 5 }] },
];

describe('rankSkillsByDuration', () => {
  it('orders by years across categories, then by name, and drops skills without years', () => {
    const names = rankSkillsByDuration(categories, 20).map(s => `${s.name}:${s.durationYears}`);
    expect(names).toEqual(['Java:20', 'Scrum:12', 'PostgreSQL:10', 'H2:8', 'MySQL:7', 'Kanban:6', 'UML:6', 'Kotlin:5']);
  });

  it('keeps one entry per name, with the longest duration', () => {
    const twice: SkillCategoryDto[] = [
      { name: 'A', skills: [{ name: 'Java', durationYears: 3 }] },
      { name: 'B', skills: [{ name: 'java', durationYears: 9 }] },
    ];
    const ranked = rankSkillsByDuration(twice, 5);
    expect(ranked).toHaveLength(1);
    expect(ranked[0].durationYears).toBe(9);
    expect(ranked[0].name.toLowerCase()).toBe('java');
  });

  it('counts every named skill', () => {
    expect(countSkills(categories)).toBe(9);
  });
});

describe('SkillsOverview', () => {
  it('shows the main skills, the longest-held skills, the category sizes and a way to the rest', () => {
    const onShowAll = vi.fn();
    render(<SkillsOverview skillCategories={categories} skills={['Java', 'Spring', 'Hibernate']} onShowAll={onShowAll} limit={3} />);

    expect(screen.getByText('Hovedferdigheter')).toBeInTheDocument();
    expect(screen.getByText('Spring')).toBeInTheDocument();
    expect(screen.getByText('Mest erfaring')).toBeInTheDocument();
    expect(screen.getByText('Java (20 år)')).toBeInTheDocument();
    expect(screen.getByText('Scrum (12 år)')).toBeInTheDocument();
    expect(screen.getByText('PostgreSQL (10 år)')).toBeInTheDocument();
    expect(screen.queryByText('H2 (8 år)')).not.toBeInTheDocument();
    expect(screen.getByText(/4 kategorier: Databaser · 3, Metodikk · 2, Modellering · 2, Programmeringsspråk · 2/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Alle 9 ferdigheter i CV-en/ }));
    expect(onShowAll).toHaveBeenCalledOnce();
  });

  it('never renders the whole list', () => {
    render(<SkillsOverview skillCategories={categories} onShowAll={() => {}} limit={3} />);
    expect(document.querySelectorAll('.MuiChip-root')).toHaveLength(3);
  });

  it('falls back to the skills as listed when nobody wrote years', () => {
    const noYears: SkillCategoryDto[] = [{ name: 'Verktøy', skills: [{ name: 'Git' }, { name: 'Maven' }] }];
    render(<SkillsOverview skillCategories={noYears} onShowAll={() => {}} />);

    expect(screen.getByText('Fra CV-en')).toBeInTheDocument();
    expect(screen.getByText('Git')).toBeInTheDocument();
    expect(screen.getByText('Maven')).toBeInTheDocument();
  });

  it('renders the empty state when there is nothing', () => {
    render(<SkillsOverview skillCategories={[]} skills={[]} onShowAll={() => {}} />);
    expect(screen.getByText('Ingen ferdigheter tilgjengelig')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
