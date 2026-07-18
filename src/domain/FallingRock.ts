import { Vec2 } from './Vec2';
import { World } from './World';
import { TileType } from './tiles';

/** Grace period before an unsupported rock starts to fall (the "wobble"). */
const DEFAULT_WOBBLE_SECONDS = 0.5;
/** Fall speed in tiles per second. */
const DEFAULT_FALL_SPEED = 8;

export enum RockState {
  Wobbling,
  Falling,
  Landed,
}

/**
 * A rock that has lost its support. It first wobbles in place (so kids can
 * react), then falls straight down one tile at a time until the tile below is
 * solid, at which point it settles back into the world as a Rock tile. While
 * transiting it is an entity, not a tile.
 */
export class FallingRock {
  private state = RockState.Wobbling;
  private wobble: number;
  private fall = 0;
  private position: Vec2;

  constructor(
    tile: Vec2,
    wobbleSeconds: number = DEFAULT_WOBBLE_SECONDS,
    private readonly fallSpeed: number = DEFAULT_FALL_SPEED,
  ) {
    this.position = tile;
    this.wobble = wobbleSeconds;
  }

  get tile(): Vec2 {
    return this.position;
  }

  get phase(): RockState {
    return this.state;
  }

  /** 0..1 progress toward the next tile while falling, for smooth rendering. */
  get fallProgress(): number {
    return this.state === RockState.Falling ? this.fall : 0;
  }

  get hasLanded(): boolean {
    return this.state === RockState.Landed;
  }

  update(dt: number, world: World): void {
    if (this.state === RockState.Wobbling) {
      this.wobble -= dt;
      if (this.wobble <= 0) this.state = RockState.Falling;
      return;
    }
    if (this.state !== RockState.Falling) return;

    this.fall += dt * this.fallSpeed;
    while (this.fall >= 1 && this.state === RockState.Falling) {
      this.advanceOneTile(world);
    }
  }

  private advanceOneTile(world: World): void {
    const below = new Vec2(this.position.x, this.position.y + 1);
    if (world.getTile(below.x, below.y) === TileType.Empty) {
      this.position = below;
      this.fall -= 1;
      return;
    }
    world.setTile(this.position.x, this.position.y, TileType.Rock);
    this.state = RockState.Landed;
    this.fall = 0;
  }
}
