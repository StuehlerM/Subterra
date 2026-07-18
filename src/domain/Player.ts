import { Battery } from './Battery';
import { Cargo } from './Cargo';
import { Consumable } from './Consumable';
import { Direction } from './Direction';
import { PlayerProgress } from './PlayerProgress';
import { Vec2 } from './Vec2';
import { World } from './World';
import { TileType, isDiggable, isSolid, tileHardness, tileValue } from './tiles';

const DEFAULT_MOVE_DURATION = 0.14;
const DEFAULT_DRILL_STRENGTH = 1;
const DEFAULT_CARGO_CAPACITY = 8;
const DEFAULT_BATTERY_CAPACITY = 30;
const DEFAULT_DYNAMITE_CAPACITY = 3;
/** Battery spent per drilled tile. */
const DIG_BATTERY_COST = 1;

export interface PlayerOptions {
  drillStrength?: number;
  moveDuration?: number;
  cargo?: Cargo;
  battery?: Battery;
  dynamite?: Consumable;
}

/**
 * The miner. Moves one tile at a time in four directions, animated via
 * `renderPosition()`. Moving into diggable ground drills through it, provided
 * the drill is strong enough, the battery has charge, and (for ore) the cargo
 * has room. Ore is collected into cargo; bedrock and too-hard ore block.
 */
export class Player {
  readonly cargo: Cargo;
  readonly battery: Battery;
  readonly dynamite: Consumable;
  drillStrength: number;
  moveDuration: number;

  private moving = false;
  private from: Vec2;
  private to: Vec2;
  private progress = 0;

  constructor(
    public tile: Vec2,
    options: PlayerOptions = {},
  ) {
    this.drillStrength = options.drillStrength ?? DEFAULT_DRILL_STRENGTH;
    this.moveDuration = options.moveDuration ?? DEFAULT_MOVE_DURATION;
    this.cargo = options.cargo ?? new Cargo(DEFAULT_CARGO_CAPACITY);
    this.battery = options.battery ?? new Battery(DEFAULT_BATTERY_CAPACITY);
    this.dynamite = options.dynamite ?? new Consumable(DEFAULT_DYNAMITE_CAPACITY);
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

  /** Applies the effective stats/capacities derived from meta-progression. */
  applyProgress(progress: PlayerProgress): void {
    this.drillStrength = progress.drillStrength;
    this.moveDuration = progress.moveDuration;
    this.cargo.setCapacity(progress.cargoCapacity);
    this.battery.setCapacity(progress.batteryCapacity);
    this.dynamite.setCapacity(progress.dynamiteCapacity);
  }

  /**
   * Begin moving one tile in `direction` if idle. Drills through diggable
   * ground first (collecting ore, spending battery). Returns whether a move
   * started.
   */
  tryStartMove(direction: Direction, world: World): boolean {
    if (this.moving) return false;
    const target = this.tile.add(new Vec2(direction.dx, direction.dy));
    if (!this.tryDig(target, world)) return false;
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

  /** Attempts to clear the target tile. Returns false if it blocks the miner. */
  private tryDig(target: Vec2, world: World): boolean {
    const tile = world.getTile(target.x, target.y);
    if (!isSolid(tile)) return true;
    if (!isDiggable(tile) || this.drillStrength < tileHardness(tile)) return false;
    if (this.battery.isEmpty) return false;

    const value = tileValue(tile);
    if (value > 0 && this.cargo.isFull) return false;

    world.setTile(target.x, target.y, TileType.Empty);
    this.battery.drain(DIG_BATTERY_COST);
    if (value > 0) this.cargo.add(value);
    return true;
  }
}
