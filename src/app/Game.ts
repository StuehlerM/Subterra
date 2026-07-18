import { Direction } from '../domain/Direction';
import { Player } from '../domain/Player';
import { World } from '../domain/World';

/**
 * Orchestrates a single fixed logic step: advance the player's movement, then
 * start a new move if a direction is requested and the player is idle. Holding a
 * direction therefore produces continuous tile-by-tile movement.
 *
 * Pure of any browser APIs so it can be unit-tested directly.
 */
export class Game {
  constructor(
    public readonly world: World,
    public readonly player: Player,
  ) {}

  step(dt: number, direction: Direction | null): void {
    this.player.update(dt);
    if (direction && !this.player.isMoving) {
      this.player.tryStartMove(direction, this.world);
    }
  }
}
