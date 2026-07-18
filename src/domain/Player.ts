import { Direction } from './Direction';
import { Vec2 } from './Vec2';
import { World } from './World';

/** Seconds it takes to traverse one tile. */
const DEFAULT_MOVE_DURATION = 0.12;

/**
 * The miner. Moves one tile at a time in four directions. Movement is animated:
 * `renderPosition()` interpolates smoothly between the from/to tiles while a
 * move is in progress. There is no gravity on the player (design decision).
 */
export class Player {
  private moving = false;
  private from: Vec2;
  private to: Vec2;
  private progress = 0;

  constructor(
    public tile: Vec2,
    private readonly moveDuration: number = DEFAULT_MOVE_DURATION,
  ) {
    this.from = tile;
    this.to = tile;
  }

  get isMoving(): boolean {
    return this.moving;
  }

  /** Smooth position in tile units, for rendering. */
  renderPosition(): Vec2 {
    return this.moving ? Vec2.lerp(this.from, this.to, this.progress) : this.tile;
  }

  /** Begin moving one tile in `direction` if idle and the target is walkable. */
  tryStartMove(direction: Direction, world: World): boolean {
    if (this.moving) return false;
    const target = this.tile.add(new Vec2(direction.dx, direction.dy));
    if (!world.isWalkable(target.x, target.y)) return false;
    this.from = this.tile;
    this.to = target;
    this.moving = true;
    this.progress = 0;
    return true;
  }

  /** Advance the current move animation by `dt` seconds. */
  update(dt: number): void {
    if (!this.moving) return;
    this.progress += dt / this.moveDuration;
    if (this.progress >= 1) {
      this.tile = this.to;
      this.moving = false;
      this.progress = 0;
    }
  }
}
