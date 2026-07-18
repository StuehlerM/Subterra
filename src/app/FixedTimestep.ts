const DEFAULT_MAX_STEPS = 5;

/**
 * Accumulates frame time and hands back a whole number of fixed logic steps to
 * run, decoupling rendering (variable rate) from logic (fixed rate). Caps the
 * steps per frame to prevent a "spiral of death" after a long stall.
 */
export class FixedTimestep {
  private accumulator = 0;

  constructor(
    private readonly step: number,
    private readonly maxSteps: number = DEFAULT_MAX_STEPS,
  ) {}

  /** How many fixed steps to run for the given frame delta. */
  advance(frameDt: number): number {
    this.accumulator += frameDt;
    let steps = 0;
    while (this.accumulator >= this.step && steps < this.maxSteps) {
      this.accumulator -= this.step;
      steps++;
    }
    if (this.accumulator > this.step) {
      this.accumulator = 0;
    }
    return steps;
  }

  /** Fractional progress toward the next step, for render interpolation. */
  get alpha(): number {
    return this.accumulator / this.step;
  }
}
