/** How many hints the tutorial walks through (see strings tutorialHints). */
const TUTORIAL_STEP_COUNT = 5;

/** Step value meaning "tutorial finished, stay silent forever". */
export const TUTORIAL_DONE = TUTORIAL_STEP_COUNT;

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

  /**
   * The index of the hint to show right now, or null when the tutorial is
   * over. Callers resolve the text at draw time, so language switches
   * retitle the active hint immediately.
   */
  currentHintIndex(): number | null {
    return this.current < TUTORIAL_DONE ? this.current : null;
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
