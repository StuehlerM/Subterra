import { Vec2 } from './Vec2';
import { World } from './World';
import { TileType } from './tiles';

/** Seconds per tile while flying (slower than walking, so the miner can flee). */
const BAT_MOVE_DURATION = 0.18;
/** Wakes when the miner comes within this many tiles (Chebyshev). */
const WAKE_RADIUS = 4;
/** While chasing, the bat only tires once the miner is farther than this. */
const LOSE_RADIUS = 8;
/** Seconds of "lost sight" before an awake bat gives up and re-sleeps. */
const TIRE_SECONDS = 3;
/** Seconds a flared bat flees before vanishing. */
const FLEE_SECONDS = 0.8;

export enum BatState {
  Sleeping,
  Chasing,
  Fleeing,
  Gone,
}

export interface BatUpdate {
  readonly hitPlayer: boolean;
}

type Step = readonly [number, number];

function chebyshev(a: Vec2, b: Vec2): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

/**
 * A bat. Sleeps in a cave until the miner comes near, then chases through open
 * tiles. Touching the miner while awake is a knock-out. A flare makes it flee
 * and vanish. If it loses the miner for a while it tires and goes back to sleep.
 */
export class Bat {
  private state = BatState.Sleeping;
  private position: Vec2;
  private moving = false;
  private from: Vec2;
  private to: Vec2;
  private progress = 0;
  private tire = 0;
  private flee = 0;
  private fleeFrom: Vec2 | null = null;

  constructor(
    tile: Vec2,
    private readonly moveDuration: number = BAT_MOVE_DURATION,
  ) {
    this.position = tile;
    this.from = tile;
    this.to = tile;
  }

  get tile(): Vec2 {
    return this.position;
  }

  get phase(): BatState {
    return this.state;
  }

  get isGone(): boolean {
    return this.state === BatState.Gone;
  }

  renderPosition(): Vec2 {
    return this.moving ? Vec2.lerp(this.from, this.to, this.progress) : this.position;
  }

  /** Banished by a flare: flee away from `from`, then vanish. */
  startFleeing(from: Vec2): void {
    if (this.state === BatState.Gone || this.state === BatState.Fleeing) return;
    this.state = BatState.Fleeing;
    this.flee = FLEE_SECONDS;
    this.fleeFrom = from;
  }

  update(dt: number, world: World, playerTile: Vec2): BatUpdate {
    if (this.state === BatState.Gone) return { hitPlayer: false };

    this.updateState(dt, playerTile);
    if (this.isGone) return { hitPlayer: false };

    this.advanceMovement(dt);
    if (!this.moving) this.decideNextStep(world, playerTile);

    const hitPlayer = this.state === BatState.Chasing && this.position.equals(playerTile);
    return { hitPlayer };
  }

  private updateState(dt: number, playerTile: Vec2): void {
    if (this.state === BatState.Fleeing) {
      this.flee -= dt;
      if (this.flee <= 0) this.state = BatState.Gone;
      return;
    }
    if (this.state === BatState.Sleeping) {
      if (chebyshev(this.position, playerTile) <= WAKE_RADIUS) {
        this.state = BatState.Chasing;
        this.tire = 0;
      }
      return;
    }
    // Chasing
    if (chebyshev(this.position, playerTile) <= LOSE_RADIUS) this.tire = 0;
    else this.tire += dt;
    if (this.tire >= TIRE_SECONDS) {
      this.state = BatState.Sleeping;
      this.tire = 0;
    }
  }

  private advanceMovement(dt: number): void {
    if (!this.moving) return;
    this.progress += dt / this.moveDuration;
    if (this.progress >= 1) {
      this.position = this.to;
      this.moving = false;
      this.progress = 0;
    }
  }

  private decideNextStep(world: World, playerTile: Vec2): void {
    if (this.state === BatState.Chasing) {
      this.tryMove(world, this.stepsToward(playerTile));
    } else if (this.state === BatState.Fleeing && this.fleeFrom) {
      this.tryMove(world, this.stepsAwayFrom(this.fleeFrom));
    }
  }

  private stepsToward(target: Vec2): Step[] {
    const dx = Math.sign(target.x - this.position.x);
    const dy = Math.sign(target.y - this.position.y);
    const horizontalFirst = Math.abs(target.x - this.position.x) >= Math.abs(target.y - this.position.y);
    return horizontalFirst
      ? [
          [dx, 0],
          [0, dy],
        ]
      : [
          [0, dy],
          [dx, 0],
        ];
  }

  private stepsAwayFrom(source: Vec2): Step[] {
    const dx = Math.sign(this.position.x - source.x) || 1;
    const dy = Math.sign(this.position.y - source.y);
    return [
      [dx, 0],
      [0, dy],
      [0, -1],
    ];
  }

  private tryMove(world: World, options: Step[]): void {
    for (const [ox, oy] of options) {
      if (ox === 0 && oy === 0) continue;
      const tx = this.position.x + ox;
      const ty = this.position.y + oy;
      if (world.getTile(tx, ty) === TileType.Empty) {
        this.from = this.position;
        this.to = new Vec2(tx, ty);
        this.moving = true;
        this.progress = 0;
        return;
      }
    }
  }
}
