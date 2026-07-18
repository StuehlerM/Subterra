import { describe, expect, it } from 'vitest';
import { Dynamite } from '../src/domain/Dynamite';
import { Vec2 } from '../src/domain/Vec2';

describe('Dynamite', () => {
  it('counts its fuse down', () => {
    const dynamite = new Dynamite(new Vec2(2, 3), 1);
    dynamite.update(0.4);
    expect(dynamite.fuseRemaining).toBeCloseTo(0.6, 5);
    expect(dynamite.hasExploded).toBe(false);
  });

  it('explodes once the fuse reaches zero', () => {
    const dynamite = new Dynamite(new Vec2(2, 3), 1);
    dynamite.update(1);
    expect(dynamite.hasExploded).toBe(true);
    expect(dynamite.fuseRemaining).toBe(0);
  });
});
