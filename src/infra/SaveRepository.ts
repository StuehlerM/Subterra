import { PlayerProgress, PlayerProgressData } from '../domain/economy/PlayerProgress';

/** How many independent save slots the title screen offers. */
export const SLOT_COUNT = 3;

interface SlotData {
  readonly seed: number;
  readonly progress: PlayerProgressData;
  readonly tutorialStep?: number;
  readonly coachLearned?: readonly string[];
}

export interface SlotSave {
  readonly seed: number;
  readonly progress: PlayerProgress;
  /** Saved tutorial step, or null when finished (legacy blobs count as finished). */
  readonly tutorialStep: number | null;
  /** Contextual-coach lessons already taught (empty for legacy/new blobs). */
  readonly coachLearned: string[];
}

/** What the slot picker shows for an occupied slot. */
export interface SlotSummary {
  readonly money: number;
}

/**
 * Persists per-slot games to a Storage backend (localStorage in the browser).
 * Each slot is its own game: a world seed plus meta-progression (money +
 * upgrade levels). Worlds are regenerated from their seed, so the blob stays
 * tiny. A pre-slot legacy save can be migrated into slot 0 once.
 */
export class SaveRepository {
  constructor(
    private readonly baseKey: string,
    private readonly storage: Storage,
  ) {}

  loadSlot(slot: number): SlotSave | null {
    const data = this.read(slot);
    return (
      data && {
        seed: data.seed,
        progress: PlayerProgress.fromJSON(data.progress),
        tutorialStep: data.tutorialStep ?? null,
        coachLearned: [...(data.coachLearned ?? [])],
      }
    );
  }

  saveSlot(
    slot: number,
    seed: number,
    progress: PlayerProgress,
    tutorialStep?: number,
    coachLearned?: readonly string[],
  ): void {
    const data: SlotData = { seed, progress: progress.toJSON(), tutorialStep, coachLearned };
    this.storage.setItem(this.slotKey(slot), JSON.stringify(data));
  }

  /** Wipes a slot back to "NEW GAME". */
  deleteSlot(slot: number): void {
    this.storage.removeItem(this.slotKey(slot));
  }

  /** One entry per slot: its money, or null while the slot is empty. */
  slotSummaries(): (SlotSummary | null)[] {
    return Array.from({ length: SLOT_COUNT }, (_, slot) => {
      const data = this.read(slot);
      return data && { money: data.progress.money };
    });
  }

  /** Moves the old single-save blob into slot 0 (once; never overwrites). */
  migrateLegacy(legacyKey: string, legacySeed: number): void {
    const raw = this.storage.getItem(legacyKey);
    if (!raw) return;
    this.storage.removeItem(legacyKey);
    if (this.read(0)) return;
    try {
      const progress = PlayerProgress.fromJSON(JSON.parse(raw) as PlayerProgressData);
      this.saveSlot(0, legacySeed, progress);
    } catch {
      // Corrupt legacy blob: nothing worth migrating.
    }
  }

  private slotKey(slot: number): string {
    if (!Number.isInteger(slot) || slot < 0 || slot >= SLOT_COUNT) {
      throw new Error(`Invalid save slot ${slot} (expected 0..${SLOT_COUNT - 1})`);
    }
    return `${this.baseKey}:slot${slot}`;
  }

  private read(slot: number): SlotData | null {
    const raw = this.storage.getItem(this.slotKey(slot));
    if (!raw) return null;
    try {
      const data = JSON.parse(raw) as SlotData;
      return typeof data.seed === 'number' && data.progress ? data : null;
    } catch {
      return null;
    }
  }
}
