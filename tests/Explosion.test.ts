import { describe, expect, it } from 'vitest';
import { explode } from '../src/domain/Explosion';
import { Vec2 } from '../src/domain/Vec2';
import { TileType } from '../src/domain/tiles';
import { worldFrom } from './helpers/worldFrom';

describe('explode', () => {
  it('clears rock and sand within the radius and reports the cleared cells', () => {
    const world = worldFrom(['sss', 'sRs', 'sss']);
    const cleared = explode(world, new Vec2(1, 1), 1);
    expect(cleared.length).toBe(9);
    for (let y = 0; y < 3; y++) {
      for (let x = 0; x < 3; x++) {
        expect(world.getTile(x, y)).toBe(TileType.Empty);
      }
    }
  });

  it('preserves ore and bedrock (and never harms them)', () => {
    const world = worldFrom(['#G#', 'sRs', '#G#']);
    explode(world, new Vec2(1, 1), 1);
    expect(world.getTile(0, 0)).toBe(TileType.Bedrock);
    expect(world.getTile(1, 0)).toBe(TileType.Gold);
    expect(world.getTile(1, 2)).toBe(TileType.Gold);
    expect(world.getTile(1, 1)).toBe(TileType.Empty); // the rock is gone
  });

  it('does not affect tiles beyond the radius', () => {
    const world = worldFrom(['sssss', 'sssss', 'ssRss', 'sssss', 'sssss']);
    explode(world, new Vec2(2, 2), 1);
    expect(world.getTile(0, 2)).toBe(TileType.Sand);
    expect(world.getTile(2, 0)).toBe(TileType.Sand);
  });
});
