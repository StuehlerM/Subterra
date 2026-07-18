import { Direction } from '../domain/Direction';
import { Dynamite } from '../domain/Dynamite';
import { sellCargo } from '../domain/Economy';
import { BLAST_RADIUS, explode } from '../domain/Explosion';
import { FallingRock } from '../domain/FallingRock';
import { Player } from '../domain/Player';
import { PlayerProgress } from '../domain/PlayerProgress';
import { Vec2 } from '../domain/Vec2';
import { TileType } from '../domain/tiles';
import { UpgradeType } from '../domain/upgrades';
import { World } from '../domain/World';

/** Seconds the red knock-out flash lingers. */
const KNOCKOUT_FLASH_SECONDS = 0.6;

/**
 * Orchestrates a single fixed logic step and owns the surface economy: when the
 * miner is at the base (surface), cargo is auto-sold and supplies recharge.
 * Also manages placed dynamite (fuse countdown and blast).
 *
 * Pure of any browser APIs so it can be unit-tested directly.
 */
export class Game {
  private lastSale = 0;
  private menuOpen = false;
  private wasAtBase = false;
  private knockoutTimer = 0;
  private readonly dynamites: Dynamite[] = [];
  private readonly fallingRocks: FallingRock[] = [];

  constructor(
    public readonly world: World,
    public readonly player: Player,
    public readonly progress: PlayerProgress,
    private readonly surfaceRows: number,
    private readonly spawn: Vec2,
  ) {
    this.player.applyProgress(progress);
  }

  step(dt: number, direction: Direction | null): void {
    this.player.update(dt);

    const atBase = this.isAtBase();
    if (atBase && !this.wasAtBase) this.menuOpen = true; // pop the menu on arrival

    // The miner is frozen while the surface menu is open.
    if (direction && !this.player.isMoving && !this.menuOpen) {
      this.player.tryStartMove(direction, this.world);
    }
    this.updateDynamites(dt);
    this.updateFallingRocks(dt);
    this.handleBase();
    if (this.knockoutTimer > 0) this.knockoutTimer = Math.max(0, this.knockoutTimer - dt);
    this.wasAtBase = atBase;
  }

  isAtBase(): boolean {
    return this.player.tile.y < this.surfaceRows;
  }

  isMenuOpen(): boolean {
    return this.menuOpen;
  }

  /** Closes the surface menu ("Drill again"); stays closed until next arrival. */
  closeMenu(): void {
    this.menuOpen = false;
  }

  /** Rows below the surface, for the HUD (0 at the surface). */
  depth(): number {
    return Math.max(0, this.player.tile.y - this.surfaceRows);
  }

  /** Money earned by the most recent auto-sale (0 if none). */
  get lastSaleAmount(): number {
    return this.lastSale;
  }

  get activeDynamites(): readonly Dynamite[] {
    return this.dynamites;
  }

  get activeFallingRocks(): readonly FallingRock[] {
    return this.fallingRocks;
  }

  /** 0..1 intensity of the fading knock-out flash (0 = none). */
  get knockoutFlash(): number {
    return this.knockoutTimer / KNOCKOUT_FLASH_SECONDS;
  }

  /**
   * Places a stick of dynamite on the miner's current tile (underground only,
   * while standing still, if supplies remain and the tile is free). Returns
   * whether one was placed.
   */
  placeDynamite(): boolean {
    if (this.isAtBase() || this.player.isMoving) return false;
    const at = this.player.tile;
    if (this.dynamites.some((d) => d.tile.equals(at))) return false;
    if (!this.player.dynamite.tryUse()) return false;
    this.dynamites.push(new Dynamite(at));
    return true;
  }

  /** Buys an upgrade and applies its effect to the miner. Returns success. */
  buyUpgrade(type: UpgradeType): boolean {
    const bought = this.progress.buy(type);
    if (bought) this.player.applyProgress(this.progress);
    return bought;
  }

  private updateDynamites(dt: number): void {
    if (this.dynamites.length === 0) return;
    for (const dynamite of this.dynamites) {
      dynamite.update(dt);
      if (dynamite.hasExploded) {
        explode(this.world, dynamite.tile, BLAST_RADIUS);
      }
    }
    for (let i = this.dynamites.length - 1; i >= 0; i--) {
      if (this.dynamites[i].hasExploded) this.dynamites.splice(i, 1);
    }
  }

  private updateFallingRocks(dt: number): void {
    this.freeUnsupportedRocks();
    for (const rock of this.fallingRocks) {
      rock.update(dt, this.world);
      if (rock.tile.equals(this.player.tile)) this.knockout();
    }
    for (let i = this.fallingRocks.length - 1; i >= 0; i--) {
      if (this.fallingRocks[i].hasLanded) this.fallingRocks.splice(i, 1);
    }
  }

  /** Converts any Rock tile with empty space below it into a falling rock. */
  private freeUnsupportedRocks(): void {
    const { width, height } = this.world;
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        if (
          this.world.getTile(x, y) === TileType.Rock &&
          this.world.getTile(x, y + 1) === TileType.Empty
        ) {
          this.world.setTile(x, y, TileType.Empty);
          this.fallingRocks.push(new FallingRock(new Vec2(x, y)));
        }
      }
    }
  }

  /** Gentle failure: wake at the surface, lose this run's cargo, keep the rest. */
  private knockout(): void {
    this.player.resetTo(this.spawn);
    this.player.cargo.clear();
    this.knockoutTimer = KNOCKOUT_FLASH_SECONDS;
  }

  private handleBase(): void {
    if (!this.isAtBase()) return;
    if (!this.player.cargo.isEmpty) {
      this.lastSale = sellCargo(this.progress, this.player.cargo);
    }
    this.player.battery.refill();
    this.player.dynamite.restock();
  }
}
