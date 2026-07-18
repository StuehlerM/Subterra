import { describe, expect, it } from 'vitest';
import { Vec2 } from '../src/domain/Vec2';

describe('Vec2', () => {
  it('adds component-wise', () => {
    const result = new Vec2(1, 2).add(new Vec2(3, -5));
    expect(result.x).toBe(4);
    expect(result.y).toBe(-3);
  });

  it('compares by value', () => {
    expect(new Vec2(2, 3).equals(new Vec2(2, 3))).toBe(true);
    expect(new Vec2(2, 3).equals(new Vec2(2, 4))).toBe(false);
  });

  it('lerps between two points', () => {
    const mid = Vec2.lerp(new Vec2(0, 0), new Vec2(10, 20), 0.5);
    expect(mid.x).toBe(5);
    expect(mid.y).toBe(10);
  });

  it('returns endpoints at t=0 and t=1', () => {
    const a = new Vec2(2, 2);
    const b = new Vec2(8, 4);
    expect(Vec2.lerp(a, b, 0).equals(a)).toBe(true);
    expect(Vec2.lerp(a, b, 1).equals(b)).toBe(true);
  });
});
