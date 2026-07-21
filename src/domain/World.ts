import { Rng } from './Rng';
import { Vec2 } from './Vec2';
import { TileType, isSolid } from './tiles';

const DEFAULT_PILLAR_CHANCE = 0.16;
const DEFAULT_ROCK_CHANCE = 0.05;
const DEFAULT_SURFACE_ROWS = 3;
const DEFAULT_SPAWN = new Vec2(1, 1);
/**
 * Fraction of the interior width that each side's sloped bedrock cliff spans,
 * so the surface reads as a valley: tall rock by the walls stepping down to an
 * open sky over the central floor.
 */
const VALLEY_SLOPE = 0.22;
/** How many rows the sloped cliffs rise above the valley floor (rest is open sky). */
const CLIFF_HEIGHT = 6;

// Cave/bat tuning.
const DEFAULT_CAVE_COUNT = 22;
const MIN_CAVE_DEPTH = 8; // rows below the surface before caves may appear
const CAVE_MAX_WIDTH = 4;
const CAVE_MAX_HEIGHT = 3;

// Portal tuning: magic gateways that whisk the miner back to the surface.
const DEFAULT_PORTAL_COUNT = 12;
const MIN_PORTAL_DEPTH = 12;

export interface GeneratedWorld {
  readonly world: World;
  /** Tiles where a sleeping bat should be placed (cave floors). */
  readonly batSpawns: Vec2[];
  /** Tiles that hold a return-to-surface portal. */
  readonly portalSpawns: Vec2[];
}

interface OreSpec {
  readonly tile: TileType;
  /** Minimum depth (rows below the surface) at which this ore can appear. */
  readonly minDepth: number;
  /** Spawn probability [0,1] once eligible. */
  readonly chance: number;
}

// Rarer/deeper ores first so they claim the low end of the random roll.
// Chances kept deliberately low so money (and upgrades) come at a steady pace.
// Depths spread over the (now much deeper) world so each tier gates a stretch.
const ORE_SPECS: readonly OreSpec[] = [
  { tile: TileType.Gem, minDepth: 70, chance: 0.01 },
  { tile: TileType.Gold, minDepth: 45, chance: 0.02 },
  { tile: TileType.Silver, minDepth: 26, chance: 0.03 },
  { tile: TileType.Iron, minDepth: 12, chance: 0.04 },
  { tile: TileType.Copper, minDepth: 4, chance: 0.05 },
  { tile: TileType.Coal, minDepth: 1, chance: 0.06 },
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
    return World.generateMap(width, height, seed, options).world;
  }

  static generateMap(
    width: number,
    height: number,
    seed: number,
    options: WorldGenOptions = {},
  ): GeneratedWorld {
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

    const batSpawns = World.carveCaves(tiles, width, height, surfaceRows, rng);
    const portalSpawns = World.placePortals(tiles, width, height, surfaceRows, rng);
    tiles[spawn.y * width + spawn.x] = TileType.Empty;
    return { world: new World(width, height, tiles), batSpawns, portalSpawns };
  }

  /**
   * Scatters return-to-surface portals in the deeper ground. Each portal tile is
   * carved open so the miner can step onto it once they dig their way in.
   */
  private static placePortals(
    tiles: Uint8Array,
    width: number,
    height: number,
    surfaceRows: number,
    rng: Rng,
  ): Vec2[] {
    const portals: Vec2[] = [];
    const minY = surfaceRows + MIN_PORTAL_DEPTH;
    const maxY = height - 2;
    if (minY > maxY || width < 4) return portals;

    for (let i = 0; i < DEFAULT_PORTAL_COUNT; i++) {
      const x = rng.range(1, width - 1);
      const y = rng.range(minY, maxY + 1);
      tiles[y * width + x] = TileType.Empty;
      portals.push(new Vec2(x, y));
    }
    return portals;
  }

  /**
   * Carves small empty pockets (caves) into the deeper ground and returns a
   * sleeping-bat spawn tile (cave floor centre) for each. Deterministic.
   */
  private static carveCaves(
    tiles: Uint8Array,
    width: number,
    height: number,
    surfaceRows: number,
    rng: Rng,
  ): Vec2[] {
    const batSpawns: Vec2[] = [];
    const minY = surfaceRows + MIN_CAVE_DEPTH;
    const maxY = height - 2;
    if (minY > maxY || width < 4) return batSpawns;

    for (let i = 0; i < DEFAULT_CAVE_COUNT; i++) {
      const cw = rng.range(2, CAVE_MAX_WIDTH + 1);
      const ch = rng.range(2, CAVE_MAX_HEIGHT + 1);
      const left = rng.range(1, Math.max(2, width - 1 - cw));
      const top = rng.range(minY, maxY - ch + 1);
      for (let y = top; y < top + ch; y++) {
        for (let x = left; x < left + cw; x++) {
          if (x > 0 && x < width - 1 && y < height - 1) tiles[y * width + x] = TileType.Empty;
        }
      }
      batSpawns.push(new Vec2(left + Math.floor(cw / 2), top + ch - 1));
    }
    return batSpawns;
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
    // Above the ground: sloped cliffs by the walls, open sky over the valley.
    if (y < surfaceRows) {
      return World.isCliffBedrock(x, y, width, surfaceRows) ? TileType.Bedrock : TileType.Empty;
    }
    if (rng.next() < pillarChance) return TileType.Bedrock;
    if (rng.next() < rockChance) return TileType.Rock;
    return World.pickOre(y - surfaceRows, rng);
  }

  /**
   * Whether a sky-band tile belongs to a side cliff: tallest (full height)
   * next to each wall, stepping down to the open centre over `span` columns.
   */
  private static isCliffBedrock(x: number, y: number, width: number, surfaceRows: number): boolean {
    const cliffH = Math.min(CLIFF_HEIGHT, surfaceRows);
    const cliffTop = surfaceRows - cliffH; // rows above this are fully open sky
    if (y < cliffTop) return false;
    const span = Math.floor((width - 2) * VALLEY_SLOPE);
    if (span < 1) return false;
    const dist = Math.min(x, width - 1 - x); // 1 == column beside a wall
    if (dist < 1 || dist > span) return false;
    const cliffSurface = cliffTop + Math.round(((dist - 1) / span) * cliffH);
    return y >= cliffSurface;
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
