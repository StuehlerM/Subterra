import { describe, expect, it } from 'vitest';
import { FixedTimestep } from '../src/app/FixedTimestep';

const STEP = 1 / 60;

describe('FixedTimestep', () => {
  it('returns zero steps when not enough time has accumulated', () => {
    const ts = new FixedTimestep(STEP);
    expect(ts.advance(STEP / 2)).toBe(0);
  });

  it('returns one step per elapsed step', () => {
    const ts = new FixedTimestep(STEP);
    expect(ts.advance(STEP)).toBe(1);
    expect(ts.advance(STEP * 3)).toBe(3);
  });

  it('carries the remainder across frames', () => {
    const ts = new FixedTimestep(STEP);
    expect(ts.advance(STEP * 1.5)).toBe(1);
    expect(ts.advance(STEP * 0.5)).toBe(1);
  });

  it('caps steps per frame to avoid the spiral of death', () => {
    const ts = new FixedTimestep(STEP, 5);
    expect(ts.advance(STEP * 1000)).toBe(5);
  });

  it('exposes fractional alpha toward the next step', () => {
    const ts = new FixedTimestep(STEP);
    ts.advance(STEP * 0.25);
    expect(ts.alpha).toBeCloseTo(0.25, 5);
  });
});
