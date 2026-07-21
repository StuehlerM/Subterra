import { describe, expect, it } from 'vitest';
import { variantIndexAt } from '../../src/infra/sprites/variants';

const VARIANTS = 3;

describe('variantIndexAt', () => {
  it('is deterministic for the same tile position', () => {
    expect(variantIndexAt(4, 9, VARIANTS)).toBe(variantIndexAt(4, 9, VARIANTS));
  });

  it('always lands inside the variant range, including negative coords', () => {
    for (let y = -3; y < 10; y++) {
      for (let x = -3; x < 10; x++) {
        const index = variantIndexAt(x, y, VARIANTS);
        expect(index).toBeGreaterThanOrEqual(0);
        expect(index).toBeLessThan(VARIANTS);
      }
    }
  });

  it('mixes variants across neighbouring tiles (no stamped look)', () => {
    const seen = new Set<number>();
    for (let y = 0; y < 4; y++) {
      for (let x = 0; x < 4; x++) seen.add(variantIndexAt(x, y, VARIANTS));
    }
    expect(seen.size).toBeGreaterThan(1);
  });

  it('returns 0 for single-variant sprites', () => {
    expect(variantIndexAt(7, 7, 1)).toBe(0);
  });
});
