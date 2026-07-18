import { describe, expect, it } from 'vitest';
import { Rng } from '../src/domain/Rng';

describe('Rng', () => {
  it('is deterministic for a given seed', () => {
    const a = new Rng(42);
    const b = new Rng(42);
    const seqA = [a.next(), a.next(), a.next()];
    const seqB = [b.next(), b.next(), b.next()];
    expect(seqA).toEqual(seqB);
  });

  it('produces different sequences for different seeds', () => {
    const a = new Rng(1);
    const b = new Rng(2);
    expect(a.next()).not.toBe(b.next());
  });

  it('returns floats within [0, 1)', () => {
    const rng = new Rng(7);
    for (let i = 0; i < 1000; i++) {
      const value = rng.next();
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(1);
    }
  });

  it('int stays within [0, max)', () => {
    const rng = new Rng(99);
    for (let i = 0; i < 1000; i++) {
      const value = rng.int(6);
      expect(value).toBeGreaterThanOrEqual(0);
      expect(value).toBeLessThan(6);
      expect(Number.isInteger(value)).toBe(true);
    }
  });

  it('range stays within [min, max)', () => {
    const rng = new Rng(123);
    for (let i = 0; i < 1000; i++) {
      const value = rng.range(5, 10);
      expect(value).toBeGreaterThanOrEqual(5);
      expect(value).toBeLessThan(10);
    }
  });
});
