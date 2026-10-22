import { describe, expect, it } from 'vitest';
import { describeRequirement, unclearMark, type RequirementCoverageItem } from './coverageText';

const item = (over: Partial<RequirementCoverageItem>): RequirementCoverageItem => ({
  name: 'Linux, Maven og Git', priority: 'MUST', skills: ['LINUX', 'MAVEN', 'GIT'], consultants: 2, projectOnly: 0, combination: 'ALL', ...over,
});

/** The tooltip reads the requirement the way it was counted (plan A3). */
describe('describeRequirement', () => {
  it('says og when every technology is asked for, and eller when one is', () => {
    expect(describeRequirement(item({}))).toBe('Må-krav: Linux, Maven og Git. 2 aktive konsulenter har linux og maven og git på CV-en.');
    expect(describeRequirement(item({ name: 'Kotlin eller Java', skills: ['KOTLIN', 'JAVA'], consultants: 40, combination: 'ANY' })))
      .toBe('Må-krav: Kotlin eller Java. 40 aktive konsulenter har kotlin eller java på CV-en.');
  });

  it('says an unclear requirement was counted as one of them, on the chip and in the tooltip', () => {
    const unclear = item({ name: 'Backend: Kotlin, Java', skills: ['KOTLIN', 'JAVA'], consultants: 40, combination: 'UNCLEAR' });
    expect(describeRequirement(unclear)).toContain('Kravet er ikke entydig');
    expect(unclearMark(unclear)).toBe(' (uklart)');
    expect(unclearMark(item({}))).toBe('');
  });
});
