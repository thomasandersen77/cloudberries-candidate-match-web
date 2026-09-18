import React from 'react';
import { describe, it, expect, afterEach } from 'vitest';
import { render, screen, cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { CoverageChips } from './RequestCoverage';
import { describeAiStatus, describeCoverage, type RequirementCoverage } from './coverageText';

afterEach(() => cleanup());

const coverage: RequirementCoverage = {
  technologyRequirements: 4,
  covered: 3,
  fullMatchCount: 0,
  fullMatchBasis: 'MUST',
  requirements: [
    { name: 'Kotlin', priority: 'MUST', skills: ['KOTLIN'], consultants: 16 },
    { name: 'Flink', priority: 'MUST', skills: ['FLINK'], consultants: 0 },
    { name: 'Dokumentert erfaring med Linux som kjøremiljø, samt bruk av Maven og Git', priority: 'MUST', skills: ['LINUX', 'MAVEN', 'GIT'], consultants: 32 },
    { name: 'Terraform', priority: 'SHOULD', skills: ['TERRAFORM'], consultants: 11 },
  ],
  otherRequirements: ['Minimum 8 års relevant arbeidserfaring', 'Norsk muntlig og skriftlig'],
};

describe('describeCoverage', () => {
  it('counts the technology requirements and names how many could not be checked', () => {
    expect(describeCoverage(coverage)).toBe('Dekker 3 av 4 teknologikrav · 2 krav sjekkes ikke mot ferdigheter');
  });

  it('says so when nothing could be checked at all', () => {
    expect(describeCoverage({ ...coverage, technologyRequirements: 0, covered: 0, requirements: [], otherRequirements: ['Tilbud leveres i KGV'] }))
      .toBe('Ingen krav som kan sjekkes mot ferdighetene i CV-ene · 1 krav sjekkes ikke mot ferdigheter');
  });
});

describe('describeAiStatus', () => {
  it('is one word with a date, or that nobody has been assessed', () => {
    expect(describeAiStatus(3, '2026-09-10T21:42:22+02:00')).toMatch(/^3 AI-vurdert \d{1,2}\.\d{1,2}\.2026$/);
    expect(describeAiStatus(null, null)).toBe('Ikke AI-vurdert');
    expect(describeAiStatus(0, null)).toBe('Ikke AI-vurdert');
  });
});

describe('CoverageChips', () => {
  it('shows each requirement with its count, musts firm and a requirement nobody holds in red', () => {
    render(<CoverageChips coverage={coverage} />);

    expect(screen.getByText('Kotlin 16')).toBeInTheDocument();
    expect(screen.getByText('Terraform 11')).toBeInTheDocument();
    const flink = screen.getByText('Flink 0').closest('.MuiChip-root');
    expect(flink?.className).toMatch(/MuiChip-colorError/);
    expect(screen.getByText('Kotlin 16').closest('.MuiChip-root')?.className).not.toMatch(/MuiChip-colorError/);
  });

  it('cuts a long requirement name on the chip and keeps the whole in the tooltip', () => {
    render(<CoverageChips coverage={coverage} />);

    const chip = screen.getByText(/^Dokumentert erfaring med Linux.*… 32$/);
    expect(chip).toBeInTheDocument();
    expect(chip.textContent!.length).toBeLessThan(60);
    expect(chip.closest('[aria-label]')?.getAttribute('aria-label') ?? '').toContain('Dokumentert erfaring med Linux som kjøremiljø, samt bruk av Maven og Git');
  });

  it('shows only the musts when asked, and counts the rest', () => {
    render(<CoverageChips coverage={coverage} mustOnly />);

    expect(screen.getByText('Kotlin 16')).toBeInTheDocument();
    expect(screen.queryByText('Terraform 11')).not.toBeInTheDocument();
    expect(screen.getByText('+ 1 bør-krav')).toBeInTheDocument();
  });

  it('renders nothing when there are no technology requirements', () => {
    const { container } = render(<CoverageChips coverage={{ ...coverage, requirements: [] }} />);
    expect(container.firstChild).toBeNull();
  });
});
