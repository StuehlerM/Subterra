const SEED_STEP = 0x6d2b79f5;
const UINT32 = 4294967296;

/**
 * Deterministic pseudo-random generator (mulberry32).
 * Same seed always produces the same sequence, so worlds are reproducible.
 */
export class Rng {
  private state: number;

  constructor(seed: number) {
    this.state = seed >>> 0;
  }

  /** Next float in the range [0, 1). */
  next(): number {
    this.state = (this.state + SEED_STEP) >>> 0;
    let t = this.state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / UINT32;
  }

  /** Next integer in the range [0, maxExclusive). */
  int(maxExclusive: number): number {
    return Math.floor(this.next() * maxExclusive);
  }

  /** Next integer in the range [minInclusive, maxExclusive). */
  range(minInclusive: number, maxExclusive: number): number {
    return minInclusive + this.int(maxExclusive - minInclusive);
  }
}
