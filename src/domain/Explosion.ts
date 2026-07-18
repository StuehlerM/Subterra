import { Vec2 } from './Vec2';
import { World } from './World';
import { TileType, isBlastable } from './tiles';

/** Chebyshev radius of a dynamite blast (1 = a 3x3 area). */
export const BLAST_RADIUS = 1;

/**
 * Detonates at `center`, clearing every blastable tile within `radius` to
 * empty. Bedrock and ore survive (ore is not wasted); the player is never
 * harmed by a blast (no friendly fire). Returns the cells that were cleared so
 * callers can react (e.g. free rocks left unsupported above them).
 */
export function explode(world: World, center: Vec2, radius: number): Vec2[] {
  const cleared: Vec2[] = [];
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const x = center.x + dx;
      const y = center.y + dy;
      if (isBlastable(world.getTile(x, y))) {
        world.setTile(x, y, TileType.Empty);
        cleared.push(new Vec2(x, y));
      }
    }
  }
  return cleared;
}
