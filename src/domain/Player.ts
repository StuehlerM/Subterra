import { Battery } from './Battery';
import { Cargo } from './Cargo';
import { Consumable } from './Consumable';
import { Direction } from './Direction';
import { PlayerProgress } from './PlayerProgress';
import { Vec2 } from './Vec2';
import { World } from './World';
import { TileType, isDiggable, isSolid, tileHardness, tileValue } from './tiles';

/** Fixed walking speed through open tiles (matches the fastest drill level). */
const DEFAULT_WALK_DURATION = 0.07;
/** Fallback drilling speed (overridden by the Drill Speed upgrade). */
const DEFAULT_DRILL_DURATION = 0.14;
/** Super-slow last-resort drill used when the battery is empty. */
const DEFAULT_EMERGENCY_DURATION = 1.2;
const DEFAULT_DRILL_STRENGTH = 1;
const DEFAULT_CARGO_CAPACITY = 8;
const DEFAULT_BATTERY_CAPACITY = 30;
const DEFAULT_DYNAMITE_CAPACITY = 3;
const DEFAULT_FLARE_CAPACITY = 2;
/** Battery spent per drilled tile. */
const DIG_BATTERY_COST = 1;

export interface PlayerOptions {
  drillStrength?: number;
  /** Convenience: sets both walk and drill durations to the same value. */
  moveDuration?: number;
  walkDuration?: number;
  drillDuration?: number;
  emergencyDuration?: number;
  cargo?: Cargo;
  battery?: Battery;
  dynamite?: Consumable;
  flare?: Consumable;
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
  readonly flare: Consumable;
  drillStrength: number;
  /** Seconds per tile while drilling solid ground (set by the upgrade). */
  drillDuration: number;
  /** Seconds per tile while walking through open tiles (fixed, fast). */
  walkDuration: number;

  private readonly emergencyDuration: number;
  private moving = false;
  private from: Vec2;
  private to: Vec2;
  private progress = 0;
  private activeDuration = DEFAULT_WALK_DURATION;
  private lastDug: Vec2 | null = null;
  private lastEmergency = false;

  constructor(
    public tile: Vec2,
    options: PlayerOptions = {},
  ) {
    this.drillStrength = options.drillStrength ?? DEFAULT_DRILL_STRENGTH;
    this.walkDuration = options.walkDuration ?? options.moveDuration ?? DEFAULT_WALK_DURATION;
    this.drillDuration = options.drillDuration ?? options.moveDuration ?? DEFAULT_DRILL_DURATION;
    this.emergencyDuration = options.emergencyDuration ?? DEFAULT_EMERGENCY_DURATION;
    this.cargo = options.cargo ?? new Cargo(DEFAULT_CARGO_CAPACITY);
    this.battery = options.battery ?? new Battery(DEFAULT_BATTERY_CAPACITY);
    this.dynamite = options.dynamite ?? new Consumable(DEFAULT_DYNAMITE_CAPACITY);
    this.flare = options.flare ?? new Consumable(DEFAULT_FLARE_CAPACITY);
    this.from = tile;
    this.to = tile;
  }

  get isMoving(): boolean {
    return this.moving;
  }

  /** The tile drilled by the most recent tryStartMove, or null if none. */
  get justDug(): Vec2 | null {
    return this.lastDug;
  }

  /** Smooth position in tile units, for rendering. */
  renderPosition(): Vec2 {
    return this.moving ? Vec2.lerp(this.from, this.to, this.progress) : this.tile;
  }

  /** Teleports the miner to a tile and cancels any in-progress move (respawn). */
  resetTo(tile: Vec2): void {
    this.tile = tile;
    this.from = tile;
    this.to = tile;
    this.moving = false;
    this.progress = 0;
  }

  /** Applies the effective stats/capacities derived from meta-progression. */
  applyProgress(progress: PlayerProgress): void {
    this.drillStrength = progress.drillStrength;
    this.drillDuration = progress.moveDuration; // walking stays fixed-fast
    this.cargo.setCapacity(progress.cargoCapacity);
    this.battery.setCapacity(progress.batteryCapacity);
    this.dynamite.setCapacity(progress.dynamiteCapacity);
    this.flare.setCapacity(progress.flareCapacity);
  }

  /**
   * Begin moving one tile in `direction` if idle. Drills through diggable
   * ground first (collecting ore, spending battery). Returns whether a move
   * started.
   */
  tryStartMove(direction: Direction, world: World): boolean {
    this.lastDug = null;
    this.lastEmergency = false;
    if (this.moving) return false;
    const target = this.tile.add(new Vec2(direction.dx, direction.dy));
    if (!this.tryDig(target, world)) return false;
    this.activeDuration = this.lastEmergency
      ? this.emergencyDuration
      : this.lastDug
        ? this.drillDuration
        : this.walkDuration;
    this.from = this.tile;
    this.to = target;
    this.moving = true;
    this.progress = 0;
    return true;
  }

  /** Advance the current move animation by `dt` seconds. */
  update(dt: number): void {
    if (!this.moving) return;
    this.progress += dt / this.activeDuration;
    if (this.progress >= 1) {
      this.tile = this.to;
      this.moving = false;
      this.progress = 0;
    }
  }

  /** Attempts to clear the target tile. Returns false if it blocks the miner. */
  private tryDig(target: Vec2, world: World): boolean {
    const tile = world.getTile(target.x, target.y);
    if (!isSolid(tile)) return true; // walking into open space
    if (tile === TileType.Bedrock) return false; // never removable

    // Out of battery: fall back to the slow, free emergency drill (any non-bedrock
    // tile, ignoring hardness) so the miner can never be permanently trapped.
    if (this.battery.isEmpty) return this.emergencyDig(target, tile, world);

    if (!isDiggable(tile) || this.drillStrength < tileHardness(tile)) return false;
    const value = tileValue(tile);
    if (value > 0 && this.cargo.isFull) return false;

    world.setTile(target.x, target.y, TileType.Empty);
    this.lastDug = target;
    this.battery.drain(DIG_BATTERY_COST);
    if (value > 0) this.cargo.add(value);
    return true;
  }

  private emergencyDig(target: Vec2, tile: TileType, world: World): boolean {
    world.setTile(target.x, target.y, TileType.Empty);
    this.lastDug = target;
    this.lastEmergency = true;
    const value = tileValue(tile);
    if (value > 0 && !this.cargo.isFull) this.cargo.add(value);
    return true;
  }
}
