/** The kinds of tile that can occupy a cell in the world grid. */
export enum TileType {
  Empty = 0,
  Sand = 1,
  Bedrock = 2,
  Coal = 3,
  Copper = 4,
  Iron = 5,
  Silver = 6,
  Gold = 7,
  Gem = 8,
  Rock = 9,
}

/** Hardness value used for tiles that can never be drilled. */
const IMPASSABLE = Number.POSITIVE_INFINITY;

export interface TileProps {
  /** Blocks player movement until removed. */
  readonly solid: boolean;
  /** Can be removed by the drill at all (false for Bedrock and Rock). */
  readonly diggable: boolean;
  /** Minimum drill strength required to drill it. */
  readonly hardness: number;
  /** Money gained when collected (0 for non-ore tiles). */
  readonly value: number;
  /** Destroyed by dynamite blasts (ore is preserved; bedrock is immune). */
  readonly blastable: boolean;
}

const TILE_PROPS: Record<TileType, TileProps> = {
  [TileType.Empty]: { solid: false, diggable: false, hardness: 0, value: 0, blastable: false },
  [TileType.Sand]: { solid: true, diggable: true, hardness: 1, value: 0, blastable: true },
  [TileType.Bedrock]: { solid: true, diggable: false, hardness: IMPASSABLE, value: 0, blastable: false },
  [TileType.Coal]: { solid: true, diggable: true, hardness: 1, value: 3, blastable: false },
  [TileType.Copper]: { solid: true, diggable: true, hardness: 1, value: 6, blastable: false },
  [TileType.Iron]: { solid: true, diggable: true, hardness: 2, value: 12, blastable: false },
  [TileType.Silver]: { solid: true, diggable: true, hardness: 3, value: 25, blastable: false },
  [TileType.Gold]: { solid: true, diggable: true, hardness: 4, value: 50, blastable: false },
  [TileType.Gem]: { solid: true, diggable: true, hardness: 5, value: 120, blastable: false },
  [TileType.Rock]: { solid: true, diggable: false, hardness: IMPASSABLE, value: 0, blastable: true },
};

export function tileProps(tile: TileType): TileProps {
  return TILE_PROPS[tile];
}

export function isSolid(tile: TileType): boolean {
  return TILE_PROPS[tile].solid;
}

export function isDiggable(tile: TileType): boolean {
  return TILE_PROPS[tile].diggable;
}

export function tileHardness(tile: TileType): number {
  return TILE_PROPS[tile].hardness;
}

export function tileValue(tile: TileType): number {
  return TILE_PROPS[tile].value;
}

export function isOre(tile: TileType): boolean {
  return TILE_PROPS[tile].value > 0;
}

export function isBlastable(tile: TileType): boolean {
  return TILE_PROPS[tile].blastable;
}
