import type { Order } from '../types/analytics';

// Generic comparator function
export function getComparator<T>(
  order: Order,
  orderBy: keyof T
): (a: T, b: T) => number {
  return order === 'desc'
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

function descendingComparator<T>(
  a: T,
  b: T,
  orderBy: keyof T
): number {
  if (b[orderBy] < a[orderBy]) {
    return -1;
  }
  if (b[orderBy] > a[orderBy]) {
    return 1;
  }
  return 0;
}

// Stable sort function
export function stableSort<T>(
  array: readonly T[],
  comparator: (a: T, b: T) => number
): T[] {
  const stabilizedThis = array.map((el, index) => [el, index] as [T, number]);
  stabilizedThis.sort((a, b) => {
    const order = comparator(a[0], b[0]);
    if (order !== 0) {
      return order;
    }
    return a[1] - b[1];
  });
  return stabilizedThis.map((el) => el[0]);
}

/** Sort key for YYYY-MM; null/empty end date (pågående) uses current month. */
export function yearMonthSortKey(yearMonth: string | null | undefined): string {
  if (!yearMonth || yearMonth.trim() === '') {
    const now = new Date();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    return `${now.getFullYear()}-${month}`;
  }
  return yearMonth;
}

/** Compare two periods descending (most recent first); ongoing end dates rank highest. */
export function compareYearMonthPeriodDesc(
  aEnd: string | null | undefined,
  bEnd: string | null | undefined,
  aStart?: string | null | undefined,
  bStart?: string | null | undefined
): number {
  const endCmp = yearMonthSortKey(bEnd).localeCompare(yearMonthSortKey(aEnd));
  if (endCmp !== 0) return endCmp;
  return (bStart || '').localeCompare(aStart || '');
}