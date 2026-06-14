import type {
  ProgrammingLanguageStat as LanguageStat,
  RoleStat as ApiRoleStat,
} from './api';

// Analytics data types (aliases of OpenAPI-generated types)
export type { LanguageStat };
export type RoleStat = ApiRoleStat;

// Sorting types
export type Order = 'asc' | 'desc';

// Column keys for sorting
export type LanguageColumn = keyof LanguageStat;
export type RoleColumn = keyof RoleStat;

// Visualization modes for roles
export type RoleVisualizationMode = 'bars' | 'circles' | 'chips';

// Analytics state
export interface AnalyticsState {
  languages: LanguageStat[];
  roles: RoleStat[];
  isLoading: boolean;
  isError: boolean;
  errorMessage: string | null;
  lastUpdated: Date | null;
}

// Filter state
export interface AnalyticsFilters {
  selectedLanguages: string[];
}