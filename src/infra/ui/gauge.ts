/** Pure gauge math (no DOM) so it stays unit-testable. */

const GREEN = '#57c04a';
const YELLOW = '#ffcf3f';
const RED = '#e04a3a';

/** Above this fraction the gauge is comfortable (green). */
const COMFORT_FRACTION = 0.5;
/** Above this fraction the gauge is merely low (yellow); below, critical. */
const LOW_FRACTION = 0.2;

/**
 * How many of `units` cells a gauge shows filled. Kid-friendly rules: any
 * non-zero charge shows at least one unit, and only a full charge shows all.
 */
export function filledUnits(current: number, capacity: number, units: number): number {
  if (capacity <= 0 || current <= 0) return 0;
  if (current >= capacity) return units;
  const proportional = Math.round((current / capacity) * units);
  return Math.max(1, Math.min(units - 1, proportional));
}

/** Traffic-light colour for a gauge fill fraction. */
export function gaugeColor(fraction: number): string {
  if (fraction > COMFORT_FRACTION) return GREEN;
  if (fraction > LOW_FRACTION) return YELLOW;
  return RED;
}
