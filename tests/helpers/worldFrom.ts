import { World } from '../../src/domain/world/World';
import { TileType } from '../../src/domain/world/tiles';

const CHAR_TO_TILE: Record<string, TileType> = {
  '.': TileType.Empty,
  s: TileType.Sand,
  '#': TileType.Bedrock,
  C: TileType.Coal,
  I: TileType.Iron,
  G: TileType.Gold,
  R: TileType.Rock,
};

/**
 * Builds a World from an ASCII map for readable, deterministic tests.
 * Legend: '.' empty, 's' sand, '#' bedrock, 'C' coal, 'I' iron, 'G' gold,
 * 'R' rock. All rows must be equal length.
 */
export function worldFrom(rows: string[]): World {
  const height = rows.length;
  const width = rows[0].length;
  const tiles = new Uint8Array(width * height);
  rows.forEach((row, y) => {
    [...row].forEach((char, x) => {
      const tile = CHAR_TO_TILE[char];
      if (tile === undefined) throw new Error(`Unknown map char '${char}'`);
      tiles[y * width + x] = tile;
    });
  });
  return new World(width, height, tiles);
}
