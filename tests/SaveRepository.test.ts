import { describe, expect, it } from 'vitest';
import { PlayerProgress } from '../src/domain/PlayerProgress';
import { SaveRepository, SLOT_COUNT } from '../src/infra/SaveRepository';

const BASE_KEY = 'test-save';
const LEGACY_KEY = 'legacy-save';
const LEGACY_SEED = 1337;

/** Minimal in-memory Storage stand-in for tests. */
function fakeStorage(initial: Record<string, string> = {}): Storage {
  const map = new Map(Object.entries(initial));
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k: string) => map.get(k) ?? null,
    key: (i: number) => [...map.keys()][i] ?? null,
    removeItem: (k: string) => void map.delete(k),
    setItem: (k: string, v: string) => void map.set(k, v),
  };
}

function repo(storage = fakeStorage()): SaveRepository {
  return new SaveRepository(BASE_KEY, storage);
}

describe('SaveRepository slots', () => {
  it('has three empty slots on a fresh storage', () => {
    const save = repo();
    expect(SLOT_COUNT).toBe(3);
    expect(save.slotSummaries()).toEqual([null, null, null]);
    expect(save.loadSlot(0)).toBeNull();
  });

  it('round-trips seed and progress per slot, independently', () => {
    const save = repo();
    save.saveSlot(0, 42, new PlayerProgress(100));
    save.saveSlot(2, 7, new PlayerProgress(950));

    expect(save.loadSlot(0)?.seed).toBe(42);
    expect(save.loadSlot(0)?.progress.money).toBe(100);
    expect(save.loadSlot(1)).toBeNull();
    expect(save.loadSlot(2)?.seed).toBe(7);
    expect(save.loadSlot(2)?.progress.money).toBe(950);
  });

  it('summarises each slot with its money for the picker', () => {
    const save = repo();
    save.saveSlot(1, 42, new PlayerProgress(250));
    expect(save.slotSummaries()).toEqual([null, { money: 250 }, null]);
  });

  it('treats corrupt slot data as empty', () => {
    const storage = fakeStorage({ [`${BASE_KEY}:slot0`]: 'not json{' });
    const save = repo(storage);
    expect(save.loadSlot(0)).toBeNull();
    expect(save.slotSummaries()[0]).toBeNull();
  });

  it('rejects out-of-range slot indices', () => {
    expect(() => repo().loadSlot(3)).toThrow(/slot/i);
    expect(() => repo().loadSlot(-1)).toThrow(/slot/i);
  });
});

describe('SaveRepository legacy migration', () => {
  it('moves the old single save into slot 0 with the legacy seed', () => {
    const storage = fakeStorage({
      [LEGACY_KEY]: JSON.stringify(new PlayerProgress(500).toJSON()),
    });
    const save = repo(storage);
    save.migrateLegacy(LEGACY_KEY, LEGACY_SEED);

    expect(save.loadSlot(0)?.seed).toBe(LEGACY_SEED);
    expect(save.loadSlot(0)?.progress.money).toBe(500);
    expect(storage.getItem(LEGACY_KEY)).toBeNull(); // consumed
  });

  it('never overwrites an existing slot 0', () => {
    const storage = fakeStorage({
      [LEGACY_KEY]: JSON.stringify(new PlayerProgress(500).toJSON()),
    });
    const save = repo(storage);
    save.saveSlot(0, 42, new PlayerProgress(9));
    save.migrateLegacy(LEGACY_KEY, LEGACY_SEED);
    expect(save.loadSlot(0)?.progress.money).toBe(9);
  });

  it('is a no-op without a legacy save', () => {
    const save = repo();
    save.migrateLegacy(LEGACY_KEY, LEGACY_SEED);
    expect(save.slotSummaries()).toEqual([null, null, null]);
  });
});
