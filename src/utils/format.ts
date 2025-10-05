// Format percentage with specified decimal places
export function formatPercent(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

// Format number with locale separators
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('nb-NO').format(value);
}

// Format aggregated years with appropriate precision
export function formatYears(value: number): string {
  if (value === 0) return '0 år';
  if (value === 1) return '1 år';
  
  // Use decimals for values less than 10, otherwise round to integers
  const formatted = value < 10 ? value.toFixed(1) : Math.round(value).toString();
  return `${formatted} år`;
}

// Format role name for consistent display
export function formatRoleName(role: string): string {
  return role.trim();
}

// Format consultant count with singular/plural
export function formatConsultantCount(count: number): string {
  if (count === 1) return '1 konsulent';
  return `${formatNumber(count)} konsulenter`;
}