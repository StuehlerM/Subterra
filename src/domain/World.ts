import { Rng } from './Rng';
import { Vec2 } from './Vec2';
import { TileType, isSolid } from './tiles';

const DEFAULT_PILLAR_CHANCE = 0.08;
const DEFAULT_ROCK_CHANCE = 0.05;
const DEFAULT_SURFACE_ROWS = 3;
const DEFAULT_SPAWN = new Vec2(1, 1);

interface OreSpec {
  readonly tile: TileType;
  /** Minimum depth (rows below the surface) at which this ore can appear. */
  readonly minDepth: number;
  /** Spawn probability [0,1] once eligible. */
  readonly chance: number;
}

// Rarer/deeper ores first so they claim the low end of the random roll.
const ORE_SPECS: readonly OreSpec[] = [
  { tile: TileType.Gem, minDepth: 30, chance: 0.02 },
  { tile: TileType.Gold, minDepth: 20, chance: 0.04 },
  { tile: TileType.Silver, minDepth: 12, chance: 0.05 },
  { tile: TileType.Iron, minDepth: 6, chance: 0.07 },
  { tile: TileType.Copper, minDepth: 2, chance: 0.08 },
  { tile: TileType.Coal, minDepth: 1, chance: 0.1 },
];

export interface WorldGenOptions {
  /** Probability [0,1] that a ground tile becomes a bedrock pillar. */
  readonly pillarChance?: number;
  /** Probability [0,1] that a ground tile becomes a destructible rock. */
  readonly rockChance?: number;
  /** Number of open-air (sky) rows at the top before the ground begins. */
  readonly surfaceRows?: number;
  /** Tile kept clear so the player has somewhere to spawn. */
  readonly spawn?: Vec2;
}

/**
 * A fixed-size grid of tiles. Out-of-bounds reads return Bedrock so the world
 * is effectively walled. Generation is deterministic for a given seed.
 */
export class World {
  constructor(
    public readonly width: number,
    public readonly height: number,
    private readonly tiles: Uint8Array,
  ) {}

  getTile(x: number, y: number): TileType {
    if (!this.inBounds(x, y)) return TileType.Bedrock;
    return this.tiles[y * this.width + x] as TileType;
  }

  setTile(x: number, y: number, tile: TileType): void {
    if (!this.inBounds(x, y)) return;
    this.tiles[y * this.width + x] = tile;
  }

  inBounds(x: number, y: number): boolean {
    return x >= 0 && y >= 0 && x < this.width && y < this.height;
  }

  isWalkable(x: number, y: number): boolean {
    return !isSolid(this.getTile(x, y));
  }

  static generate(width: number, height: number, seed: number, options: WorldGenOptions = {}): World {
    const pillarChance = options.pillarChance ?? DEFAULT_PILLAR_CHANCE;
    const rockChance = options.rockChance ?? DEFAULT_ROCK_CHANCE;
    const surfaceRows = options.surfaceRows ?? DEFAULT_SURFACE_ROWS;
    const spawn = options.spawn ?? DEFAULT_SPAWN;
    const rng = new Rng(seed);
    const tiles = new Uint8Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        tiles[y * width + x] = World.pickTile(x, y, width, height, surfaceRows, rng, pillarChance, rockChance);
      }
    }

    tiles[spawn.y * width + spawn.x] = TileType.Empty;
    return new World(width, height, tiles);
  }

  private static pickTile(
    x: number,
    y: number,
    width: number,
    height: number,
    surfaceRows: number,
    rng: Rng,
    pillarChance: number,
    rockChance: number,
  ): TileType {
    // Left/right walls and the bottom floor are indestructible; the top is open sky.
    if (x === 0 || x === width - 1 || y === height - 1) return TileType.Bedrock;
    if (y < surfaceRows) return TileType.Empty;
    if (rng.next() < pillarChance) return TileType.Bedrock;
    if (rng.next() < rockChance) return TileType.Rock;
    return World.pickOre(y - surfaceRows, rng);
  }

  private static pickOre(depth: number, rng: Rng): TileType {
    const roll = rng.next();
    let threshold = 0;
    for (const spec of ORE_SPECS) {
      if (depth < spec.minDepth) continue;
      threshold += spec.chance;
      if (roll < threshold) return spec.tile;
    }
    return TileType.Sand;
  }
}
