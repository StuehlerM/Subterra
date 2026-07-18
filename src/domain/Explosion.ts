import { Vec2 } from './Vec2';
import { World } from './World';
import { TileType, isBlastable } from './tiles';

/** Chebyshev radius of a dynamite blast (1 = a 3x3 area). */
export const BLAST_RADIUS = 1;

/**
 * Detonates at `center`, clearing every blastable tile within `radius` to
 * empty. Bedrock and ore survive (ore is not wasted); the player is never
 * harmed by a blast (no friendly fire).
 */
export function explode(world: World, center: Vec2, radius: number): void {
  for (let dy = -radius; dy <= radius; dy++) {
    for (let dx = -radius; dx <= radius; dx++) {
      const x = center.x + dx;
      const y = center.y + dy;
      if (isBlastable(world.getTile(x, y))) {
        world.setTile(x, y, TileType.Empty);
      }
    }
  }
}
