/**
 * The contextual "coach": teaches a mechanic the first time the player meets
 * the situation that needs it, then stays quiet forever. Unlike the scripted
 * Tutorial, it is event-driven — it watches what is happening right now and
 * fires a single, learn-once hint that highlights the thing it is about.
 *
 * Pure (no DOM, no game imports) so it can be unit-tested directly; the caller
 * builds the per-frame observation and renders the returned cue.
 */

/** How long a fired hint stays on screen before it counts as learned. */
export const COACH_SHOW_MS = 4000;
/** A bat teaches the flare only inside this distance band (not too close/far). */
export const COACH_BAT_MIN = 2;
export const COACH_BAT_MAX = 5;
/** A portal is pointed out once it comes within this many tiles (discovery). */
export const COACH_PORTAL_MAX = 5;

export type CoachLesson =
  | 'rock'
  | 'bat'
  | 'batteryEmpty'
  | 'supplyEmpty'
  | 'cargoFull'
  | 'portal';

/** Danger/urgency first: the order lessons are offered when several apply. */
const PRIORITY: readonly CoachLesson[] = [
  'rock',
  'bat',
  'batteryEmpty',
  'supplyEmpty',
  'cargoFull',
  'portal',
];

/** What a cue points at: a world tile, a world entity, or a HUD gauge. */
export type CoachTarget =
  | { readonly kind: 'tile'; readonly x: number; readonly y: number }
  | { readonly kind: 'entity'; readonly x: number; readonly y: number }
  | { readonly kind: 'hud'; readonly element: 'battery' | 'cargo' | 'supply' };

export interface CoachCue {
  readonly lesson: CoachLesson;
  readonly target: CoachTarget;
}

/** What the coach can observe about the running game, per frame. */
export interface CoachObservation {
  readonly underground: boolean;
  readonly blockingRock: { readonly x: number; readonly y: number } | null;
  readonly dynamiteRemaining: number;
  readonly nearestBat: { readonly x: number; readonly y: number; readonly distance: number } | null;
  readonly flareRemaining: number;
  readonly cargoFull: boolean;
  readonly batteryEmpty: boolean;
  readonly nearestPortal: { readonly x: number; readonly y: number; readonly distance: number } | null;
}

interface ActiveCue {
  lesson: CoachLesson;
  target: CoachTarget;
  elapsedMs: number;
}

export class Coach {
  private readonly learned: Set<CoachLesson>;
  private active: ActiveCue | null = null;

  constructor(learned: Iterable<string> = []) {
    this.learned = new Set([...learned].filter(isLesson));
  }

  /** Lessons already taught, for persistence. */
  learnedIds(): CoachLesson[] {
    return PRIORITY.filter((lesson) => this.learned.has(lesson));
  }

  /**
   * Advances the coach one frame and returns the cue to show now (or null).
   * A fired cue stays up for COACH_SHOW_MS, tracking its (possibly moving)
   * target, and is marked learned when that window elapses.
   */
  update(observation: CoachObservation, dtMs: number): CoachCue | null {
    if (this.active) {
      const held = this.tick(observation, dtMs);
      if (held) return held;
    }
    return this.fireNext(observation);
  }

  private tick(observation: CoachObservation, dtMs: number): CoachCue | null {
    const active = this.active!;
    active.elapsedMs += dtMs;
    const target = this.targetFor(active.lesson, observation);
    if (target) active.target = target; // follow the hazard while it lingers
    if (active.elapsedMs >= COACH_SHOW_MS) {
      this.learned.add(active.lesson);
      this.active = null;
      return null;
    }
    return { lesson: active.lesson, target: active.target };
  }

  private fireNext(observation: CoachObservation): CoachCue | null {
    const lesson = PRIORITY.find(
      (candidate) => !this.learned.has(candidate) && this.triggers(candidate, observation),
    );
    if (!lesson) return null;
    const target = this.targetFor(lesson, observation)!;
    this.active = { lesson, target, elapsedMs: 0 };
    return { lesson, target };
  }

  private triggers(lesson: CoachLesson, o: CoachObservation): boolean {
    if (!o.underground) return false;
    switch (lesson) {
      case 'rock':
        return o.blockingRock !== null && o.dynamiteRemaining > 0;
      case 'bat':
        return (
          o.nearestBat !== null &&
          o.nearestBat.distance >= COACH_BAT_MIN &&
          o.nearestBat.distance <= COACH_BAT_MAX &&
          o.flareRemaining > 0
        );
      case 'batteryEmpty':
        return o.batteryEmpty;
      case 'supplyEmpty':
        // Either supply running out is enough to send the miner back to restock.
        return o.dynamiteRemaining <= 0 || o.flareRemaining <= 0;
      case 'cargoFull':
        return o.cargoFull;
      case 'portal':
        return o.nearestPortal !== null && o.nearestPortal.distance <= COACH_PORTAL_MAX;
    }
  }

  private targetFor(lesson: CoachLesson, o: CoachObservation): CoachTarget | null {
    switch (lesson) {
      case 'rock':
        return o.blockingRock && { kind: 'tile', x: o.blockingRock.x, y: o.blockingRock.y };
      case 'bat':
        return o.nearestBat && { kind: 'entity', x: o.nearestBat.x, y: o.nearestBat.y };
      case 'batteryEmpty':
        return { kind: 'hud', element: 'battery' };
      case 'supplyEmpty':
        return { kind: 'hud', element: 'supply' };
      case 'cargoFull':
        return { kind: 'hud', element: 'cargo' };
      case 'portal':
        return o.nearestPortal && { kind: 'tile', x: o.nearestPortal.x, y: o.nearestPortal.y };
    }
  }
}

function isLesson(id: string): id is CoachLesson {
  return (PRIORITY as readonly string[]).includes(id);
}
