import { describe, expect, it } from 'vitest';
import { TileType } from '../../src/domain/world/tiles';
import { parseGrid } from '../../src/infra/sprites/grid';
import { TILE_SPRITES } from '../../src/infra/sprites/art/tiles';
import { ENTITY_SPRITES } from '../../src/infra/sprites/art/entities';
import { BACKGROUND_SPRITES } from '../../src/infra/sprites/art/backgrounds';

const TILE_SIZE = 16;
const ENTITY_SIZE = 16;
const CAVE_SIZE = 32;

const ORE_TILES = [
  TileType.Coal,
  TileType.Copper,
  TileType.Iron,
  TileType.Silver,
  TileType.Gold,
  TileType.Gem,
];

const ANIMATED_ENTITIES = ['player', 'bat', 'bat_asleep', 'dynamite', 'flare', 'portal'];

function allSprites() {
  return [
    ...Object.entries(TILE_SPRITES).map(([k, s]) => [`tile ${k}`, s!] as const),
    ...Object.entries(ENTITY_SPRITES).map(([k, s]) => [`entity ${k}`, s] as const),
    ...Object.entries(BACKGROUND_SPRITES).map(([k, s]) => [`background ${k}`, s] as const),
  ];
}

describe('sprite art', () => {
  it('every frame of every sprite parses through its palette', () => {
    for (const [name, sprite] of allSprites()) {
      for (const frame of sprite.frames) {
        expect(() => parseGrid(frame, sprite.palette), name).not.toThrow();
      }
    }
  });

  it('all frames of a sprite share the same dimensions', () => {
    for (const [name, sprite] of allSprites()) {
      const first = parseGrid(sprite.frames[0], sprite.palette);
      for (const frame of sprite.frames) {
        const parsed = parseGrid(frame, sprite.palette);
        expect(parsed.width, name).toBe(first.width);
        expect(parsed.height, name).toBe(first.height);
      }
    }
  });

  it('every drawable tile has 16x16 art', () => {
    const drawable = [TileType.Sand, TileType.Bedrock, TileType.Rock, ...ORE_TILES];
    for (const tile of drawable) {
      const sprite = TILE_SPRITES[tile];
      expect(sprite, TileType[tile]).toBeDefined();
      const parsed = parseGrid(sprite!.frames[0], sprite!.palette);
      expect(parsed.width, TileType[tile]).toBe(TILE_SIZE);
      expect(parsed.height, TileType[tile]).toBe(TILE_SIZE);
    }
  });

  it('every entity has 16x16 art', () => {
    for (const [name, sprite] of Object.entries(ENTITY_SPRITES)) {
      const parsed = parseGrid(sprite.frames[0], sprite.palette);
      expect(parsed.width, name).toBe(ENTITY_SIZE);
      expect(parsed.height, name).toBe(ENTITY_SIZE);
    }
  });

  it('animated entities have at least two distinct frames', () => {
    for (const name of ANIMATED_ENTITIES) {
      const sprite = ENTITY_SPRITES[name];
      expect(sprite.frames.length, name).toBeGreaterThanOrEqual(2);
      expect(sprite.frames[0].join('\n'), name).not.toBe(sprite.frames[1].join('\n'));
    }
  });

  it('ore tiles share the same shape variants but have distinct palettes', () => {
    const coal = TILE_SPRITES[TileType.Coal]!;
    expect(coal.frames.length).toBeGreaterThanOrEqual(2); // visual variety
    const shapes = coal.frames.map((f) => f.join('\n')).join('\n\n');
    expect(new Set(coal.frames.map((f) => f.join('\n'))).size).toBe(coal.frames.length);
    const seenPalettes = new Set<string>();
    for (const ore of ORE_TILES) {
      const sprite = TILE_SPRITES[ore]!;
      expect(sprite.frames.map((f) => f.join('\n')).join('\n\n'), TileType[ore]).toBe(shapes);
      seenPalettes.add(JSON.stringify(sprite.palette));
    }
    expect(seenPalettes.size).toBe(ORE_TILES.length);
  });

  it('opaque ground tiles have no transparent pixels', () => {
    for (const tile of [TileType.Sand, TileType.Bedrock]) {
      const sprite = TILE_SPRITES[tile]!;
      for (const row of sprite.frames[0]) {
        expect(row.includes('.'), TileType[tile]).toBe(false);
      }
    }
  });

  it('backgrounds: sky is a 1-wide vertical ramp, cave is a 32x32 pattern', () => {
    const sky = parseGrid(BACKGROUND_SPRITES.sky.frames[0], BACKGROUND_SPRITES.sky.palette);
    expect(sky.width).toBe(1);
    expect(sky.height).toBeGreaterThanOrEqual(8);
    const cave = parseGrid(BACKGROUND_SPRITES.cave.frames[0], BACKGROUND_SPRITES.cave.palette);
    expect(cave.width).toBe(CAVE_SIZE);
    expect(cave.height).toBe(CAVE_SIZE);
  });
});
