import { TileType } from '../../domain/tiles';

/** What the director observes about the game, once per frame. */
export interface AudioSnapshot {
  readonly moving: boolean;
  /** The current move started by drilling (vs walking into open space). */
  readonly dug: boolean;
  readonly collected: TileType | null;
  readonly tileX: number;
  readonly tileY: number;
  readonly activeDynamites: number;
  readonly activeFlares: number;
  readonly awakeBats: number;
  readonly knockoutFlash: number;
  readonly menuOpen: boolean;
  readonly money: number;
}

/** A tile jump longer than this is a teleport, not a step. */
const TELEPORT_DISTANCE = 3;
/** Footsteps only tick on every Nth tile so walking stays unobtrusive. */
const WALK_TICK_EVERY = 2;

const ORE_CHIME: Partial<Record<TileType, string>> = {
  [TileType.Coal]: 'ore_coal',
  [TileType.Copper]: 'ore_copper',
  [TileType.Iron]: 'ore_iron',
  [TileType.Silver]: 'ore_silver',
  [TileType.Gold]: 'ore_gold',
  [TileType.Gem]: 'ore_gem',
};

/**
 * Watches per-frame game snapshots and decides which sound effects fire.
 * Pure delta logic (no WebAudio), so every trigger rule is unit-testable;
 * the caller feeds the returned names to the AudioEngine.
 */
export class AudioDirector {
  private previous: AudioSnapshot | null = null;
  private steps = 0;

  /** Compares against the last frame and returns the effects to play now. */
  update(snapshot: AudioSnapshot): string[] {
    const before = this.previous;
    this.previous = snapshot;
    if (!before) return [];

    const sounds: string[] = [];
    this.movement(before, snapshot, sounds);
    this.hazards(before, snapshot, sounds);
    this.surface(before, snapshot, sounds);
    return sounds;
  }

  private movement(before: AudioSnapshot, now: AudioSnapshot, sounds: string[]): void {
    const moveStarted = now.moving && !before.moving;
    if (moveStarted) {
      if (now.dug) {
        sounds.push('drill');
      } else if (this.steps++ % WALK_TICK_EVERY === 0) {
        sounds.push('walk');
      }
      const chime = now.collected !== null ? ORE_CHIME[now.collected] : undefined;
      if (chime) sounds.push(chime);
    }

    const jumped =
      Math.abs(now.tileX - before.tileX) + Math.abs(now.tileY - before.tileY) >= TELEPORT_DISTANCE;
    if (jumped && now.knockoutFlash <= before.knockoutFlash) sounds.push('portal');
  }

  private hazards(before: AudioSnapshot, now: AudioSnapshot, sounds: string[]): void {
    if (now.activeDynamites > before.activeDynamites) sounds.push('dynamite_place');
    if (now.activeDynamites < before.activeDynamites) sounds.push('explosion');
    if (now.activeFlares > before.activeFlares) sounds.push('flare');
    if (now.awakeBats > before.awakeBats) sounds.push('bat_wake');
    if (now.knockoutFlash > 0 && before.knockoutFlash <= 0) sounds.push('knockout');
  }

  private surface(before: AudioSnapshot, now: AudioSnapshot, sounds: string[]): void {
    if (now.menuOpen && !before.menuOpen) {
      sounds.push(now.money > before.money ? 'sell' : 'menu_open');
    }
  }
}
