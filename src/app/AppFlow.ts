/** Which top-level screen owns the input and the frame. */
export enum Screen {
  Title = 'title',
  SlotSelect = 'slot-select',
  Playing = 'playing',
  Paused = 'paused',
}

/**
 * Pure screen state machine: Title → SlotSelect → Playing ⇄ Paused.
 * Gameplay keys only reach the Game while Playing (the caller checks
 * `screen`); Esc is a meta key that pauses, and losing window focus
 * auto-pauses. No DOM here, so the whole flow is unit-testable.
 */
export class AppFlow {
  private current = Screen.Title;
  private cursor = 0;

  constructor(private readonly slotCount: number) {}

  get screen(): Screen {
    return this.current;
  }

  /** The slot the picker highlights (and, once playing, the active slot). */
  get slotCursor(): number {
    return this.cursor;
  }

  /** X: advance Title → SlotSelect → Playing. Ignored while playing/paused. */
  pressConfirm(): void {
    if (this.current === Screen.Title) this.current = Screen.SlotSelect;
    else if (this.current === Screen.SlotSelect) this.current = Screen.Playing;
  }

  /** Z: back out of the slot picker. Ignored elsewhere. */
  pressBack(): void {
    if (this.current === Screen.SlotSelect) this.current = Screen.Title;
  }

  /** Left/Right on the slot picker: move the cursor (wraps). */
  navigate(step: -1 | 1): void {
    if (this.current !== Screen.SlotSelect) return;
    this.cursor = (this.cursor + step + this.slotCount) % this.slotCount;
  }

  /** Esc: toggle pause, but only in or out of play. */
  pressPause(): void {
    if (this.current === Screen.Playing) this.current = Screen.Paused;
    else if (this.current === Screen.Paused) this.current = Screen.Playing;
  }

  /** Window lost focus: auto-pause an active game. */
  windowBlurred(): void {
    if (this.current === Screen.Playing) this.current = Screen.Paused;
  }
}
