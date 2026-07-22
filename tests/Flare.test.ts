import { describe, expect, it } from 'vitest';
import { Flare } from '../src/domain/entities/Flare';
import { Vec2 } from '../src/domain/math/Vec2';

describe('Flare', () => {
  it('burns down and finishes', () => {
    const flare = new Flare(new Vec2(2, 3)); // default 2s life
    flare.update(0.8);
    expect(flare.isDone).toBe(false);
    expect(flare.intensity).toBeCloseTo(0.6, 5);
    flare.update(2);
    expect(flare.isDone).toBe(true);
  });

  it('reports full intensity when freshly lit', () => {
    const flare = new Flare(new Vec2(0, 0), 2);
    expect(flare.intensity).toBe(1);
  });
});
