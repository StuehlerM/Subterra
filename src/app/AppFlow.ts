/** Which top-level screen owns the input and the frame. */
export enum Screen {
  Title = 'title',
  SlotSelect = 'slot-select',
  Options = 'options',
  ConfirmDelete = 'confirm-delete',
  Playing = 'playing',
  Paused = 'paused',
}

/** Entries of the title menu, top to bottom. */
export const TITLE_ENTRIES = 2; // START GAME, OPTIONS
/** Entries of the options screen, top to bottom. */
export const OPTIONS_ENTRIES = 2; // SOUND, LANGUAGE

/**
 * Pure screen state machine: Title (menu) → SlotSelect (with per-slot delete
 * confirmation) or Options, then Playing ⇄ Paused. Gameplay keys only reach
 * the Game while Playing (the caller checks `screen`); Esc is a meta key that
 * pauses, and losing window focus auto-pauses. No DOM here, so the whole flow
 * is unit-testable.
 */
export class AppFlow {
  private current = Screen.Title;
  private cursor = 0;
  private titleRow = 0;
  private optionsRow = 0;
  private deleteRow = false;
  private occupied: boolean[] = [];

  constructor(private readonly slotCount: number) {}

  get screen(): Screen {
    return this.current;
  }

  /** The slot the picker highlights (and, once playing, the active slot). */
  get slotCursor(): number {
    return this.cursor;
  }

  /** 0 = START GAME, 1 = OPTIONS. */
  get titleCursor(): number {
    return this.titleRow;
  }

  /** 0 = SOUND, 1 = LANGUAGE. */
  get optionsCursor(): number {
    return this.optionsRow;
  }

  /** Whether the picker highlights the DELETE button under the slot. */
  get onDeleteRow(): boolean {
    return this.deleteRow;
  }

  /** The picker only offers DELETE on occupied slots; main keeps this fresh. */
  updateOccupancy(occupied: boolean[]): void {
    this.occupied = occupied;
  }

  /** X: advance menus. Ignored while playing/paused (X is the flare there). */
  pressConfirm(): void {
    switch (this.current) {
      case Screen.Title:
        this.current = this.titleRow === 0 ? Screen.SlotSelect : Screen.Options;
        break;
      case Screen.SlotSelect:
        this.current = this.deleteRow ? Screen.ConfirmDelete : Screen.Playing;
        break;
      case Screen.ConfirmDelete:
        this.current = Screen.SlotSelect;
        this.deleteRow = false;
        break;
      default:
        break;
    }
  }

  /** Z: back out of pickers and dialogs. Ignored elsewhere. */
  pressBack(): void {
    switch (this.current) {
      case Screen.SlotSelect:
        this.current = Screen.Title;
        this.deleteRow = false;
        break;
      case Screen.Options:
        this.current = Screen.Title;
        break;
      case Screen.ConfirmDelete:
        this.current = Screen.SlotSelect;
        break;
      default:
        break;
    }
  }

  /** Left/Right on the slot picker: move the cursor (wraps). */
  navigate(step: -1 | 1): void {
    if (this.current !== Screen.SlotSelect || this.deleteRow === true) {
      if (this.current === Screen.SlotSelect && this.deleteRow) {
        // Sideways from the delete row jumps back up to the slots.
        this.deleteRow = false;
      } else {
        return;
      }
    }
    this.cursor = (this.cursor + step + this.slotCount) % this.slotCount;
  }

  /** Up/Down inside menus (title entries, options entries, slot ↔ delete). */
  moveVertical(step: -1 | 1): void {
    switch (this.current) {
      case Screen.Title:
        this.titleRow = clamp(this.titleRow + step, TITLE_ENTRIES);
        break;
      case Screen.Options:
        this.optionsRow = clamp(this.optionsRow + step, OPTIONS_ENTRIES);
        break;
      case Screen.SlotSelect:
        if (step > 0 && this.occupied[this.cursor]) this.deleteRow = true;
        if (step < 0) this.deleteRow = false;
        break;
      default:
        break;
    }
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

function clamp(value: number, entryCount: number): number {
  return Math.max(0, Math.min(entryCount - 1, value));
}
