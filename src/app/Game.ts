import { Direction } from '../domain/Direction';
import { sellCargo } from '../domain/Economy';
import { Player } from '../domain/Player';
import { PlayerProgress } from '../domain/PlayerProgress';
import { UpgradeType } from '../domain/upgrades';
import { World } from '../domain/World';

/**
 * Orchestrates a single fixed logic step and owns the surface economy: when the
 * miner is at the base (surface), cargo is auto-sold and the battery recharges.
 *
 * Pure of any browser APIs so it can be unit-tested directly.
 */
export class Game {
  private lastSale = 0;

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

  /** Buys an upgrade and applies its effect to the miner. Returns success. */
  buyUpgrade(type: UpgradeType): boolean {
    const bought = this.progress.buy(type);
    if (bought) this.player.applyProgress(this.progress);
    return bought;
  }

  private handleBase(): void {
    if (!this.isAtBase()) return;
    if (!this.player.cargo.isEmpty) {
      this.lastSale = sellCargo(this.progress, this.player.cargo);
    }
    this.player.battery.refill();
  }
}
