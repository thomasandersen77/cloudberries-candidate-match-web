import type { ConsultantWithCvDto, SkillCategoryDto, SkillInCategoryDto } from '../types/api';

interface SkillWithDuration {
  name: string;
  duration: number;
  category?: string;
}

/**
 * Extracts the top skills from a consultant's CV data, prioritizing by experience duration
 * @param consultant The consultant data with CV information
 * @param limit Maximum number of skills to return (default: 3)
 * @returns Array of skill names sorted by experience duration (highest first)
 */
export function getTopSkills(consultant: ConsultantWithCvDto, limit: number = 3): string[] {
  // Prefer backend-provided top 3 skills when available
  if (consultant.skills && consultant.skills.length > 0) {
    return consultant.skills.slice(0, limit);
  }
  const activeCv = consultant.cvs?.find(cv => cv.active);
  if (!activeCv || !activeCv.skillCategories) {
    return [];
  }

  const skillsWithDuration: SkillWithDuration[] = [];

  // Extract all skills with their duration from skill categories
  activeCv.skillCategories.forEach((category: SkillCategoryDto) => {
    if (category.skills) {
      category.skills.forEach((skill: SkillInCategoryDto) => {
        if (skill.name && skill.durationYears) {
          skillsWithDuration.push({
            name: skill.name,
            duration: skill.durationYears,
            category: category.name || undefined
          });
        }
      });
    }
  });

  // If no skills with duration found, fallback to consultant.skills
  if (skillsWithDuration.length === 0) {
    return [];
  }

  // Sort by duration (highest first), then by name for consistency
  skillsWithDuration.sort((a, b) => {
    if (b.duration !== a.duration) {
      return b.duration - a.duration;
    }
    return a.name.localeCompare(b.name);
  });

  // Return top skills, limiting to requested number
  return skillsWithDuration
    .slice(0, limit)
    .map(skill => skill.name);
}

export interface RankedSkill {
  name: string;
  durationYears: number;
  category?: string;
}

/**
 * The skills with the most years behind them, across every category, longest first and then by
 * name, one entry per name. Skills without a duration are left out: there is nothing to rank them
 * by, and the full list is one click away.
 */
export function rankSkillsByDuration(skillCategories: SkillCategoryDto[], limit: number): RankedSkill[] {
  const byName = new Map<string, RankedSkill>();
  for (const category of skillCategories) {
    for (const skill of category.skills ?? []) {
      const name = skill.name?.trim();
      const years = skill.durationYears ?? 0;
      if (!name || years <= 0) continue;
      const seen = byName.get(name.toLowerCase());
      if (!seen || seen.durationYears < years) {
        byName.set(name.toLowerCase(), { name, durationYears: years, category: category.name ?? undefined });
      }
    }
  }
  return Array.from(byName.values())
    .sort((a, b) => (b.durationYears - a.durationYears) || a.name.localeCompare(b.name, 'no'))
    .slice(0, limit);
}

/** Every skill entry in the categories, the number the full CV page shows as chips. */
export function countSkills(skillCategories: SkillCategoryDto[]): number {
  return skillCategories.reduce((n, c) => n + (c.skills?.filter(s => s.name?.trim()).length ?? 0), 0);
}

/**
 * Gets all skills from a consultant including those with duration info
 * @param consultant The consultant data
 * @returns Array of all skill names
 */
export function getAllSkills(consultant: ConsultantWithCvDto): string[] {
  // Try to extract full list from CV categories when available
  const activeCv = consultant.cvs?.find(cv => cv.active);
  const names: string[] = [];
  if (activeCv && activeCv.skillCategories) {
    activeCv.skillCategories.forEach(cat => {
      cat.skills?.forEach(s => {
        if (s.name) names.push(s.name);
      });
    });
  }
  if (names.length > 0) {
    // normalize & unique
    return Array.from(new Set(names.map(n => n.trim()).filter(Boolean)));
  }
  // Fallback to backend-provided top skills (may already be capped at 3)
  return consultant.skills;
}

/**
 * Gets a formatted display string for skills with count indicator
 * @param consultant The consultant data
 * @param displayLimit Number of skills to display
 * @returns Object with displaySkills and remainingCount
 */
export function getSkillsDisplay(consultant: ConsultantWithCvDto, displayLimit: number = 3): {
  displaySkills: string[];
  remainingCount: number;
} {
  const topSkills = getTopSkills(consultant, displayLimit);
  const allSkills = getAllSkills(consultant);
  
  return {
    displaySkills: topSkills,
    remainingCount: Math.max(0, allSkills.length - displayLimit)
  };
}