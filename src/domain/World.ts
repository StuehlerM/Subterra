import { Rng } from './Rng';
import { Vec2 } from './Vec2';
import { TileType, isSolid } from './tiles';

const DEFAULT_PILLAR_CHANCE = 0.08;
const DEFAULT_SURFACE_ROWS = 3;
const DEFAULT_SPAWN = new Vec2(1, 1);

export interface WorldGenOptions {
  /** Probability [0,1] that a ground tile becomes a bedrock pillar. */
  readonly pillarChance?: number;
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
    const surfaceRows = options.surfaceRows ?? DEFAULT_SURFACE_ROWS;
    const spawn = options.spawn ?? DEFAULT_SPAWN;
    const rng = new Rng(seed);
    const tiles = new Uint8Array(width * height);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        tiles[y * width + x] = World.pickTile(x, y, width, height, surfaceRows, rng, pillarChance);
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
  ): TileType {
    // Left/right walls and the bottom floor are indestructible; the top is open sky.
    if (x === 0 || x === width - 1 || y === height - 1) return TileType.Bedrock;
    if (y < surfaceRows) return TileType.Empty;
    return rng.next() < pillarChance ? TileType.Bedrock : TileType.Sand;
  }
}
