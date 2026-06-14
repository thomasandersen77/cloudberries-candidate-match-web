import {analyticsClient} from './apiClient';
import type {LanguageStat, RoleStat} from '../types/analytics';

// For backward compatibility alias
export type ProgrammingLanguageStat = LanguageStat;
export type {RoleStat};
export async function getProgrammingLanguageStats(languages?: string[]): Promise<LanguageStat[]> {
    const {data} = await analyticsClient.get<LanguageStat[]>('analytics/programming-languages', {
        params: languages && languages.length > 0 ? {languages} : undefined,
    });
    return data;
}
// Backward compatible name
export const getLanguageStats = getProgrammingLanguageStats;

export async function getRoleStats(): Promise<RoleStat[]> {
    const {data} = await analyticsClient.get<RoleStat[]>(`analytics/roles`);
    return data;
}
