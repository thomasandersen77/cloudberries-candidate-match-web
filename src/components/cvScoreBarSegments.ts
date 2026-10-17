import { clamp } from '../utils/scoreUtils';

/** Ten squares, ten points each. */
export const SEGMENTS = 10;

/**
 * How much of each square is green, 0..1, for a score out of 100.
 *
 * Whole squares for every full ten, and the next one filled by the remainder: 84 is eight full
 * squares and the ninth at 0.4. Rounding to whole squares would draw 84 and 80 the same.
 */
export function segmentFill(score: number): number[] {
  const pct = clamp(score, 0, 100);
  return Array.from({ length: SEGMENTS }, (_, i) => clamp((pct - i * 10) / 10, 0, 1));
}
