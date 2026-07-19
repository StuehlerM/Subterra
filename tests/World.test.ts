import { describe, expect, it } from 'vitest';
import { Vec2 } from '../src/domain/Vec2';
import { World } from '../src/domain/World';
import { TileType, isDiggable, isOre } from '../src/domain/tiles';

const SIZE = 10;
const SURFACE_ROWS = 3;

describe('World generation', () => {
  it('generates identical worlds for the same seed', () => {
    const a = World.generate(20, 20, 555);
    const b = World.generate(20, 20, 555);
    for (let y = 0; y < 20; y++) {
      for (let x = 0; x < 20; x++) {
        expect(a.getTile(x, y)).toBe(b.getTile(x, y));
      }
    }
  });

  it('walls the left/right sides and the bottom with bedrock', () => {
    const world = World.generate(SIZE, SIZE, 1);
    for (let y = 0; y < SIZE; y++) {
      expect(world.getTile(0, y)).toBe(TileType.Bedrock);
      expect(world.getTile(SIZE - 1, y)).toBe(TileType.Bedrock);
    }
    for (let x = 0; x < SIZE; x++) {
      expect(world.getTile(x, SIZE - 1)).toBe(TileType.Bedrock);
    }
  });

  it('leaves open-air surface rows at the top and diggable ground below', () => {
    const world = World.generate(SIZE, SIZE, 1, {
      surfaceRows: SURFACE_ROWS,
      pillarChance: 0,
      rockChance: 0,
    });
    // Interior surface rows are open air.
    for (let y = 0; y < SURFACE_ROWS; y++) {
      expect(world.getTile(3, y)).toBe(TileType.Empty);
    }
    // Interior ground rows are diggable (sand or ore) with no bedrock pillars.
    for (let y = SURFACE_ROWS; y < SIZE - 1; y++) {
      const tile = world.getTile(3, y);
      expect(tile).not.toBe(TileType.Empty);
      expect(isDiggable(tile)).toBe(true);
    }
  });

  it('carves caves and returns bat spawns on cave floors', () => {
    const { world, batSpawns } = World.generateMap(40, 80, 7);
    expect(batSpawns.length).toBeGreaterThan(0);
    for (const spawn of batSpawns) {
      expect(world.getTile(spawn.x, spawn.y)).toBe(TileType.Empty);
    }
  });

  it('places return portals on open tiles deep underground', () => {
    const { world, portalSpawns } = World.generateMap(40, 80, 7);
    expect(portalSpawns.length).toBeGreaterThan(0);
    for (const portal of portalSpawns) {
      expect(world.getTile(portal.x, portal.y)).toBe(TileType.Empty);
    }
  });

  it('scatters ore into the ground (deterministically for a seed)', () => {
    const world = World.generate(40, 80, 2024);
    let oreCount = 0;
    for (let y = 0; y < 80; y++) {
      for (let x = 0; x < 40; x++) {
        if (isOre(world.getTile(x, y))) oreCount += 1;
      }
    }
    expect(oreCount).toBeGreaterThan(0);
  });

  it('treats out-of-bounds tiles as bedrock (non-walkable)', () => {
    const world = World.generate(SIZE, SIZE, 1);
    expect(world.getTile(-1, 5)).toBe(TileType.Bedrock);
    expect(world.getTile(5, 100)).toBe(TileType.Bedrock);
    expect(world.isWalkable(-1, 5)).toBe(false);
  });

  it('keeps the spawn tile clear even in dense ground', () => {
    const spawn = new Vec2(4, 5);
    const world = World.generate(SIZE, SIZE, 1, { spawn, pillarChance: 1 });
    expect(world.getTile(spawn.x, spawn.y)).toBe(TileType.Empty);
    expect(world.isWalkable(spawn.x, spawn.y)).toBe(true);
  });

  it('setTile updates walkability and ignores out-of-bounds', () => {
    const world = World.generate(SIZE, SIZE, 1);
    world.setTile(2, 2, TileType.Bedrock);
    expect(world.isWalkable(2, 2)).toBe(false);
    expect(() => world.setTile(-5, -5, TileType.Empty)).not.toThrow();
  });
});
