import type { BrandTheme } from '../theme';
import SopraSteriaLogo from '../assets/sopra_steria.png';

export type BrandPresentation = {
  displayName: string;
  tagline: string;
  logoSrc?: string;
  logoAlt: string;
};

/**
 * Single source of truth for brand presentation.
 * To swap logos later, update only this file.
 */
export const BRANDING: Record<BrandTheme, BrandPresentation> = {
  cloudberries: {
    displayName: 'Cloudberries',
    tagline: 'Intelligent Skill Search & Matching Platform',
    // Optional fallback without image logo.
    logoAlt: 'Cloudberries logo',
  },
  soprasteria: {
    displayName: 'Sopra Steria',
    tagline: 'Sopra Steria Candidate Match',
    logoSrc: SopraSteriaLogo,
    logoAlt: 'Sopra Steria logo',
  },
};
