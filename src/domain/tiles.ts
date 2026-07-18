/** The kinds of tile that can occupy a cell in the world grid. */
export enum TileType {
  Empty = 0,
  Sand = 1,
  Bedrock = 2,
}

export interface TileProps {
  /** Blocks player movement until removed. */
  readonly solid: boolean;
  /** Can be removed by the drill (Sand); false for Bedrock. */
  readonly diggable: boolean;
}

const TILE_PROPS: Record<TileType, TileProps> = {
  [TileType.Empty]: { solid: false, diggable: false },
  [TileType.Sand]: { solid: true, diggable: true },
  [TileType.Bedrock]: { solid: true, diggable: false },
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
