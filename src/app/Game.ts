import { Bat, BatState } from '../domain/Bat';
import { Direction } from '../domain/Direction';
import { Dynamite } from '../domain/Dynamite';
import { sellCargo } from '../domain/Economy';
import { explode } from '../domain/Explosion';
import { FallingRock } from '../domain/FallingRock';
import { FLARE_RADIUS, Flare } from '../domain/Flare';
import { Player } from '../domain/Player';
import { PlayerProgress } from '../domain/PlayerProgress';
import { Vec2 } from '../domain/Vec2';
import { TileType } from '../domain/tiles';
import { UpgradeType } from '../domain/upgrades';
import { World } from '../domain/World';

/** Seconds the red knock-out flash lingers. */
const KNOCKOUT_FLASH_SECONDS = 0.9;
/** Seconds the miner lies stunned ("OUCH!") before being teleported home. */
const KNOCKOUT_STUN_SECONDS = 2;
/** Fraction of a second the "OUCH!" banner fades over at the end of the stun. */
const BANNER_FADE_SECONDS = 0.3;

function chebyshev(a: Vec2, b: Vec2): number {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}

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
  private knockoutStun = 0;
  private readonly dynamites: Dynamite[] = [];
  private readonly fallingRocks: FallingRock[] = [];
  private readonly bats: Bat[] = [];
  private readonly flares: Flare[] = [];
  private readonly portals: Vec2[];

  constructor(
    public readonly world: World,
    public readonly player: Player,
    public readonly progress: PlayerProgress,
    private readonly surfaceRows: number,
    private readonly spawn: Vec2,
    batSpawns: readonly Vec2[] = [],
    portalSpawns: readonly Vec2[] = [],
  ) {
    this.player.applyProgress(progress);
    this.settleWorld();
    for (const tile of batSpawns) this.bats.push(new Bat(tile));
    this.portals = portalSpawns.map((tile) => tile);
  }

  step(dt: number, direction: Direction | null): void {
    // Stunned after a hit: freeze the world, show "OUCH!", then teleport home.
    if (this.knockoutStun > 0) {
      this.player.update(dt); // let any in-progress move settle onto its tile
      this.knockoutStun = Math.max(0, this.knockoutStun - dt);
      if (this.knockoutTimer > 0) this.knockoutTimer = Math.max(0, this.knockoutTimer - dt);
      if (this.knockoutStun === 0) this.respawn();
      return;
    }

    this.player.update(dt);

    const atBase = this.isAtBase();
    if (atBase && !this.wasAtBase) this.menuOpen = true; // pop the menu on arrival

    // The miner is frozen while the surface menu is open.
    if (direction && !this.player.isMoving && !this.menuOpen) {
      this.player.tryStartMove(direction, this.world);
      const dug = this.player.justDug;
      if (dug) this.freeRocksAbove(dug.x, dug.y);
    }
    this.updateDynamites(dt);
    this.updateFallingRocks(dt);
    this.updateBatsAndFlares(dt);
    this.usePortalIfStandingOnOne();
    this.handleBase();
    if (this.knockoutTimer > 0) this.knockoutTimer = Math.max(0, this.knockoutTimer - dt);
    this.wasAtBase = atBase;
  }

  isAtBase(): boolean {
    return this.player.tile.y < this.surfaceRows;
  }

  /** World row where the ground begins (rows above it are open sky). */
  get surfaceRow(): number {
    return this.surfaceRows;
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

  get activeBats(): readonly Bat[] {
    return this.bats;
  }

  get activeFlares(): readonly Flare[] {
    return this.flares;
  }

  get activePortals(): readonly Vec2[] {
    return this.portals;
  }

  /** 0..1 intensity of the fading knock-out flash (0 = none). */
  get knockoutFlash(): number {
    return this.knockoutTimer / KNOCKOUT_FLASH_SECONDS;
  }

  /** 0..1 opacity for the "OUCH!" banner (full while stunned, fades at the end). */
  get knockoutBanner(): number {
    if (this.knockoutStun <= 0) return 0;
    return Math.min(1, this.knockoutStun / BANNER_FADE_SECONDS);
  }

  /** Whether the miner is currently stunned (frozen, awaiting teleport home). */
  get isStunned(): boolean {
    return this.knockoutStun > 0;
  }

  /**
   * Places a stick of dynamite on the miner's current tile (underground only,
   * while standing still, if supplies remain and the tile is free). Returns
   * whether one was placed.
   */
  placeDynamite(): boolean {
    if (this.isStunned || this.isAtBase() || this.player.isMoving) return false;
    const at = this.player.tile;
    if (this.dynamites.some((d) => d.tile.equals(at))) return false;
    if (!this.player.dynamite.tryUse()) return false;
    this.dynamites.push(new Dynamite(at));
    return true;
  }

  /**
   * Lights a flare on the miner's tile (underground only, if supplies remain).
   * Nearby bats flee and vanish. Returns whether one was lit.
   */
  useFlare(): boolean {
    if (this.isStunned || this.isAtBase()) return false;
    if (!this.player.flare.tryUse()) return false;
    this.flares.push(new Flare(this.player.tile));
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
        const cleared = explode(this.world, dynamite.tile, this.progress.blastRadius);
        for (const cell of cleared) this.freeRocksAbove(cell.x, cell.y);
      }
    }
    for (let i = this.dynamites.length - 1; i >= 0; i--) {
      if (this.dynamites[i].hasExploded) this.dynamites.splice(i, 1);
    }
  }

  private updateFallingRocks(dt: number): void {
    if (this.fallingRocks.length === 0) return;
    for (const rock of this.fallingRocks) {
      rock.update(dt, this.world);
      if (rock.tile.equals(this.player.tile)) this.knockout();
    }
    for (let i = this.fallingRocks.length - 1; i >= 0; i--) {
      if (this.fallingRocks[i].hasLanded) this.fallingRocks.splice(i, 1);
    }
  }

  /**
   * Frees the contiguous column of rocks resting on the tile just below (x, y),
   * which has become empty. Cascades upward so stacks collapse in sequence.
   * Called only when a tile is emptied (drill/blast) — no per-frame scanning.
   */
  private freeRocksAbove(x: number, y: number): void {
    let ry = y - 1;
    while (this.world.getTile(x, ry) === TileType.Rock) {
      this.world.setTile(x, ry, TileType.Empty);
      this.fallingRocks.push(new FallingRock(new Vec2(x, ry)));
      ry -= 1;
    }
  }

  /** One-time pass at startup: free any rock generated without support below. */
  private settleWorld(): void {
    const { width, height } = this.world;
    for (let y = height - 1; y >= 0; y--) {
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

  /** Gentle failure: a brief stun with an "OUCH!" tell, then teleport home. */
  private knockout(): void {
    if (this.knockoutStun > 0) return; // already down; ignore further hits
    this.knockoutStun = KNOCKOUT_STUN_SECONDS;
    this.knockoutTimer = KNOCKOUT_FLASH_SECONDS;
  }

  /** The delayed part of a knock-out: wake home, lose this run's cargo. */
  private respawn(): void {
    this.player.resetTo(this.spawn);
    this.player.cargo.clear();
  }

  private updateBatsAndFlares(dt: number): void {
    this.updateFlares(dt);
    // The surface base is a safe haven: bats can't knock the miner out there,
    // and any that chased them home give up (flee and vanish) so they can't
    // camp the frozen miner or strike the moment they descend again.
    const safe = this.isAtBase();
    for (const bat of this.bats) {
      const result = bat.update(dt, this.world, this.player.tile);
      if (result.hitPlayer && !safe) this.knockout();
    }
    if (safe) {
      for (const bat of this.bats) {
        if (bat.phase === BatState.Chasing) bat.startFleeing(this.player.tile);
      }
    }
    for (let i = this.bats.length - 1; i >= 0; i--) {
      if (this.bats[i].isGone) this.bats.splice(i, 1);
    }
  }

  private updateFlares(dt: number): void {
    if (this.flares.length === 0) return;
    for (const flare of this.flares) {
      flare.update(dt);
      for (const bat of this.bats) {
        if (chebyshev(bat.tile, flare.tile) <= FLARE_RADIUS) bat.startFleeing(flare.tile);
      }
    }
    for (let i = this.flares.length - 1; i >= 0; i--) {
      if (this.flares[i].isDone) this.flares.splice(i, 1);
    }
  }

  /** Stepping onto a portal instantly whisks the miner home (cargo kept). */
  private usePortalIfStandingOnOne(): void {
    if (this.player.isMoving) return;
    for (const portal of this.portals) {
      if (this.player.tile.equals(portal)) {
        this.player.resetTo(this.spawn);
        return;
      }
    }
  }

  private handleBase(): void {
    if (!this.isAtBase()) return;
    if (!this.player.cargo.isEmpty) {
      this.lastSale = sellCargo(this.progress, this.player.cargo);
    }
    this.player.battery.refill();
    this.player.dynamite.restock();
    this.player.flare.restock();
  }
}
