import { describe, expect, it } from 'vitest';
import { Vec2 } from '../src/domain/Vec2';
import { World } from '../src/domain/World';
import { TileType } from '../src/domain/tiles';

describe('World', () => {
  it('generates identical worlds for the same seed', () => {
    const a = World.generate(20, 20, 555);
    const b = World.generate(20, 20, 555);
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        expect(a.getTile(x, y)).toBe(b.getTile(x, y));
      }
    }
  });

  it('surrounds the map with a bedrock border', () => {
    const world = World.generate(10, 10, 1);
    for (let x = 0; x < 10; x++) {
      expect(world.getTile(x, 0)).toBe(TileType.Bedrock);
      expect(world.getTile(x, 9)).toBe(TileType.Bedrock);
    }
    for (let y = 0; y < 10; y++) {
      expect(world.getTile(0, y)).toBe(TileType.Bedrock);
      expect(world.getTile(9, y)).toBe(TileType.Bedrock);
    }
  });

  it('treats out-of-bounds tiles as bedrock (non-walkable)', () => {
    const world = World.generate(10, 10, 1);
    expect(world.getTile(-1, 5)).toBe(TileType.Bedrock);
    expect(world.getTile(5, 100)).toBe(TileType.Bedrock);
    expect(world.isWalkable(-1, 5)).toBe(false);
  });

  it('keeps the spawn tile clear and walkable', () => {
    const spawn = new Vec2(1, 1);
    const world = World.generate(10, 10, 1, { spawn, pillarChance: 1 });
    expect(world.getTile(spawn.x, spawn.y)).toBe(TileType.Empty);
    expect(world.isWalkable(spawn.x, spawn.y)).toBe(true);
  });

  it('setTile updates walkability and ignores out-of-bounds', () => {
    const world = World.generate(10, 10, 1);
    world.setTile(2, 2, TileType.Bedrock);
    expect(world.isWalkable(2, 2)).toBe(false);
    expect(() => world.setTile(-5, -5, TileType.Empty)).not.toThrow();
  });
});
