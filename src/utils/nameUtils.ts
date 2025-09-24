/**
 * Extracts the last name from a full name string
 * @param fullName The full name string (e.g., "John Doe Smith")
 * @returns The last name (e.g., "Smith")
 */
export function getLastName(fullName: string): string {
  if (!fullName || typeof fullName !== 'string') {
    return '';
  }
  
  const nameParts = fullName.trim().split(/\s+/);
  return nameParts.length > 0 ? nameParts[nameParts.length - 1] : '';
}

/**
 * Sorts an array of consultants by last name in ascending order
 * @param consultants Array of consultant objects with name property
 * @returns Sorted array of consultants
 */
export function sortConsultantsByLastName<T extends { name: string }>(consultants: T[]): T[] {
  return [...consultants].sort((a, b) => {
    const lastNameA = getLastName(a.name).toLowerCase();
    const lastNameB = getLastName(b.name).toLowerCase();
    return lastNameA.localeCompare(lastNameB, 'no-NO');
  });
}