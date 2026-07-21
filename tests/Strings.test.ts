import { describe, expect, it } from 'vitest';
import { STRINGS, TUTORIAL_HINTS } from '../src/app/strings';
import { PIXEL_FONT } from '../src/infra/sprites/art/ui';

/** Every user-facing string must be drawable with the pixel font. */
describe('strings', () => {
  const all = [...Object.values(STRINGS), ...TUTORIAL_HINTS];

  it('has the core UI strings', () => {
    expect(STRINGS.title).toBe('DEEP DIGGERS');
    expect(TUTORIAL_HINTS.length).toBe(5);
  });

  it('only uses characters the pixel font can draw', () => {
    for (const text of all) {
      for (const char of text) {
        if (char === ' ') continue; // space = plain advance
        expect(PIXEL_FONT[char], `'${char}' in "${text}"`).toBeDefined();
      }
    }
  });
});
