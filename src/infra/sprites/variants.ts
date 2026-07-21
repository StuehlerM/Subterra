/** Pure per-tile variant selection (no DOM) so it stays unit-testable. */

const HASH_X = 0x27d4eb2d;
const HASH_Y = 0x165667b1;

/**
 * Picks a stable sprite variant for a tile position. The same (x, y) always
 * yields the same variant, and neighbouring tiles mix variants so repeated
 * ground doesn't look stamped.
 */
export function variantIndexAt(x: number, y: number, variantCount: number): number {
  if (variantCount <= 1) return 0;
  let h = (Math.imul(x, HASH_X) ^ Math.imul(y, HASH_Y)) >>> 0;
  h ^= h >>> 15;
  h = Math.imul(h, 0x85ebca6b) >>> 0;
  h = (h ^ (h >>> 13)) >>> 0; // back to unsigned after the XOR
  return h % variantCount;
}
