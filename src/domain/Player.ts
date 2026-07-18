import { Direction } from './Direction';
import { Vec2 } from './Vec2';
import { World } from './World';
import { TileType, isDiggable, isSolid } from './tiles';

/** Seconds it takes to traverse one tile. */
const DEFAULT_MOVE_DURATION = 0.12;

/**
 * The miner. Moves one tile at a time in four directions. Movement is animated:
 * `renderPosition()` interpolates smoothly between the from/to tiles while a
 * move is in progress. There is no gravity on the player (design decision).
 *
 * Moving into diggable ground (sand) drills through it: the tile is removed and
 * the miner advances into it in the same action. Solid, non-diggable tiles
 * (bedrock) block movement.
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

  /**
   * Begin moving one tile in `direction` if idle. Digs through diggable ground
   * first; blocked only by solid non-diggable tiles. Returns whether a move
   * started.
   */
  tryStartMove(direction: Direction, world: World): boolean {
    if (this.moving) return false;
    const target = this.tile.add(new Vec2(direction.dx, direction.dy));
    const tile = world.getTile(target.x, target.y);
    if (isSolid(tile)) {
      if (!isDiggable(tile)) return false;
      world.setTile(target.x, target.y, TileType.Empty);
    }
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
