import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import AiSuggestions from './AiSuggestions';
import { bandOf, formatScore, groupRequirements } from './suggestionText';
import type { AISuggestionDto } from '../../types/api';

afterEach(() => cleanup());

const suggestion = (name: string, score: number, extra: Partial<AISuggestionDto> = {}): AISuggestionDto => ({
  id: null,
  consultantName: name,
  userId: `user-${name}`,
  cvId: `cv-${name}`,
  matchScore: score * 10,
  score,
  justification: `${name} har solid erfaring med **Kotlin**.`,
  createdAt: '2026-10-17T17:34:23',
  skills: ['Java', 'JUnit'],
  requirements: [],
  ...extra
});

describe('suggestionText', () => {
  it('uses the prompt’s own bands', () => {
    expect(bandOf(8)).toBe('strong');
    expect(bandOf(7.9)).toBe('partial');
    expect(bandOf(5)).toBe('partial');
    expect(bandOf(4.9)).toBe('weak');
  });

  it('says a score is out of ten, not a percentage', () => {
    expect(formatScore(7.6)).toBe('7,6 / 10');
  });

  it('groups musts and shoulds, each in the request’s order', () => {
    const { must, should } = groupRequirements([
      { name: 'Kotlin', isMustHave: true, score: 7 },
      { name: 'Grafana', isMustHave: false, score: 7.5 },
      { name: 'Kafka', isMustHave: true, score: 8 }
    ]);
    expect(must.map(r => r.name)).toEqual(['Kotlin', 'Kafka']);
    expect(should.map(r => r.name)).toEqual(['Grafana']);
  });
});

describe('AiSuggestions', () => {
  /** Run 23 on request 9011 scored fifteen; the page showed all of them as one wall of text. */
  it('shows the five best, and the rest on request', () => {
    const many = [7.6, 7.1, 6.9, 6.8, 6.6, 6.4, 6.3].map((s, i) => suggestion(`K${i + 1}`, s));
    render(<AiSuggestions suggestions={many.reverse()} />);

    expect(screen.getByText('K1')).toBeInTheDocument();
    expect(screen.getByText('K5')).toBeInTheDocument();
    expect(screen.queryByText('K6')).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Vis alle 7' }));

    expect(screen.getByText('K7')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Vis bare de 5 beste' })).toBeInTheDocument();
  });

  it('lays out the requirement scores under Må-krav and Bør-krav, names in bold', () => {
    render(<AiSuggestions suggestions={[suggestion('Sara Haugse', 6.3, {
      requirements: [
        { name: 'Kotlin', isMustHave: true, score: 6.5 },
        { name: 'Teamledelse', isMustHave: true, score: 3.5 },
        { name: 'Grafana', isMustHave: false, score: 8.5 }
      ]
    })]} />);

    expect(screen.getByText('6,3 / 10')).toBeInTheDocument();
    expect(screen.getByText('Må-krav')).toBeInTheDocument();
    expect(screen.getByText('Bør-krav')).toBeInTheDocument();
    const kotlin = screen.getAllByText('Kotlin');
    const inChip = kotlin.find(el => el.closest('.MuiChip-root'));
    expect(inChip?.tagName).toBe('STRONG');
    expect(screen.getByText('Teamledelse').closest('.MuiChip-root')?.className).toMatch(/colorWarning/);
    expect(screen.getByText('Grafana').closest('.MuiChip-root')?.className).toMatch(/colorSuccess/);
    // The summary is read as markdown: **Kotlin** in the text is bold there too, outside any chip.
    expect(kotlin.some(el => el.tagName === 'STRONG' && el.closest('p'))).toBe(true);
  });

  it('does not show the consultant’s overall top skills as if they answered the request', () => {
    render(<AiSuggestions suggestions={[suggestion('Joachim Lous', 7.6)]} />);

    expect(screen.queryByText(/JUnit/)).not.toBeInTheDocument();
  });

  it('still renders against a backend that sends no breakdown and no 0-10 score', () => {
    const old = { ...suggestion('Brage', 7.1), score: undefined, requirements: undefined } as unknown as AISuggestionDto;
    render(<AiSuggestions suggestions={[old]} />);

    expect(screen.getByText('7,1 / 10')).toBeInTheDocument();
    expect(screen.queryByText('Må-krav')).not.toBeInTheDocument();
  });
});
