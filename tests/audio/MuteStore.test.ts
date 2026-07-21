import { describe, expect, it } from 'vitest';
import { MuteStore } from '../../src/infra/audio/MuteStore';

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

const KEY = 'test-muted';

describe('MuteStore', () => {
  it('defaults to sound on', () => {
    expect(new MuteStore(KEY, fakeStorage()).muted).toBe(false);
  });

  it('toggle flips and persists across instances', () => {
    const storage = fakeStorage();
    const store = new MuteStore(KEY, storage);
    expect(store.toggle()).toBe(true);
    expect(new MuteStore(KEY, storage).muted).toBe(true);
    expect(store.toggle()).toBe(false);
    expect(new MuteStore(KEY, storage).muted).toBe(false);
  });
});
