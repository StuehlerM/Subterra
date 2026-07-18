import { Direction } from '../domain/Direction';
import { Dynamite } from '../domain/Dynamite';
import { sellCargo } from '../domain/Economy';
import { BLAST_RADIUS, explode } from '../domain/Explosion';
import { Player } from '../domain/Player';
import { PlayerProgress } from '../domain/PlayerProgress';
import { UpgradeType } from '../domain/upgrades';
import { World } from '../domain/World';

/**
 * Orchestrates a single fixed logic step and owns the surface economy: when the
 * miner is at the base (surface), cargo is auto-sold and supplies recharge.
 * Also manages placed dynamite (fuse countdown and blast).
 *
 * Pure of any browser APIs so it can be unit-tested directly.
 */
export class Game {
  private lastSale = 0;
  private readonly dynamites: Dynamite[] = [];

  constructor(
    public readonly world: World,
    public readonly player: Player,
    public readonly progress: PlayerProgress,
    private readonly surfaceRows: number,
  ) {
    this.player.applyProgress(progress);
  }

  step(dt: number, direction: Direction | null): void {
    this.player.update(dt);
    if (direction && !this.player.isMoving) {
      this.player.tryStartMove(direction, this.world);
    }
    this.updateDynamites(dt);
    this.handleBase();
  }

  isAtBase(): boolean {
    return this.player.tile.y < this.surfaceRows;
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

  private handleBase(): void {
    if (!this.isAtBase()) return;
    if (!this.player.cargo.isEmpty) {
      this.lastSale = sellCargo(this.progress, this.player.cargo);
    }
    this.player.battery.refill();
    this.player.dynamite.restock();
  }
}
