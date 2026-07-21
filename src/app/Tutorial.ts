import { TUTORIAL_HINTS } from './strings';

/** Step value meaning "tutorial finished, stay silent forever". */
export const TUTORIAL_DONE = TUTORIAL_HINTS.length;

/** How deep the final "dig deep" step considers deep enough. */
const GOAL_DEPTH = 5;

/** What the tutorial can observe about the running game, per frame. */
export interface TutorialObservation {
  readonly underground: boolean;
  readonly hasOre: boolean;
  readonly shopOpen: boolean;
  readonly boughtSomething: boolean;
  readonly depth: number;
}

/**
 * The first-run tutorial: a pure step machine that advances one hint at a
 * time when the player actually does the thing (dig → collect ore → sell →
 * shop → dig deep). Progress persists per save slot; a finished tutorial
 * never speaks again.
 */
export class Tutorial {
  private current: number;
  private shopWasOpen = false;

  constructor(step: number) {
    this.current = Number.isInteger(step)
      ? Math.max(0, Math.min(TUTORIAL_DONE, step))
      : TUTORIAL_DONE;
  }

  get step(): number {
    return this.current;
  }

  /** The hint to show right now, or null when the tutorial is over. */
  currentHint(): string | null {
    return this.current < TUTORIAL_DONE ? TUTORIAL_HINTS[this.current] : null;
  }

  /** Advances at most one step per call, so hints are never skipped unseen. */
  update(seen: TutorialObservation): void {
    if (this.stepCompleted(seen)) this.current++;
    this.shopWasOpen = seen.shopOpen;
  }

  private stepCompleted(seen: TutorialObservation): boolean {
    switch (this.current) {
      case 0:
        // Carrying ore proves they dug, even if we first look while surfaced.
        return seen.underground || seen.hasOre;
      case 1:
        return seen.hasOre;
      case 2:
        return seen.shopOpen;
      case 3:
        return seen.boughtSomething || (this.shopWasOpen && !seen.shopOpen);
      case 4:
        return seen.underground && seen.depth >= GOAL_DEPTH;
      default:
        return false;
    }
  }
}
