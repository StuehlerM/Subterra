import { describe, expect, it } from 'vitest';
import { LanguageStore } from '../src/infra/LanguageStore';

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

const KEY = 'test-language';

describe('LanguageStore', () => {
  it('defaults to english', () => {
    expect(new LanguageStore(KEY, fakeStorage()).language).toBe('en');
  });

  it('cycles en → sv → de → en and persists', () => {
    const storage = fakeStorage();
    const store = new LanguageStore(KEY, storage);
    expect(store.cycle()).toBe('sv');
    expect(store.cycle()).toBe('de');
    expect(new LanguageStore(KEY, storage).language).toBe('de');
    expect(store.cycle()).toBe('en');
  });

  it('ignores corrupt stored values', () => {
    expect(new LanguageStore(KEY, fakeStorage({ [KEY]: 'xx' })).language).toBe('en');
  });
});
