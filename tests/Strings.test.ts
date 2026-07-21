import { afterEach, describe, expect, it } from 'vitest';
import {
  LANGUAGES,
  currentLanguage,
  setLanguage,
  str,
  tutorialHints,
  upgradeNames,
} from '../src/app/strings';
import { ALL_UPGRADES } from '../src/domain/upgrades';
import { PIXEL_FONT } from '../src/infra/sprites/art/ui';

const TUTORIAL_STEPS = 5;

afterEach(() => setLanguage('en'));

describe('i18n strings', () => {
  it('supports english, swedish and german', () => {
    expect(LANGUAGES).toEqual(['en', 'sv', 'de']);
  });

  it('switching the language changes every table live', () => {
    setLanguage('sv');
    expect(currentLanguage()).toBe('sv');
    expect(str().newGame).toBe('NYTT SPEL');
    expect(str().languageName).toBe('SVENSKA');
    setLanguage('de');
    expect(str().newGame).toBe('NEUES SPIEL');
    expect(upgradeNames()[ALL_UPGRADES[0]]).not.toBe('POWER');
  });

  it('every language has all tutorial hints and upgrade names', () => {
    for (const lang of LANGUAGES) {
      setLanguage(lang);
      expect(tutorialHints().length, lang).toBe(TUTORIAL_STEPS);
      for (const type of ALL_UPGRADES) {
        expect(upgradeNames()[type], `${lang} upgrade ${type}`).toBeTruthy();
      }
    }
  });

  it('every string in every language is drawable with the pixel font', () => {
    for (const lang of LANGUAGES) {
      setLanguage(lang);
      const all = [...Object.values(str()), ...tutorialHints(), ...Object.values(upgradeNames())];
      for (const text of all) {
        for (const char of text) {
          if (char === ' ') continue;
          expect(PIXEL_FONT[char], `'${char}' in "${text}" (${lang})`).toBeDefined();
        }
      }
    }
  });

  it('the title stays the brand in every language', () => {
    for (const lang of LANGUAGES) {
      setLanguage(lang);
      expect(str().title).toBe('SUBTERRA');
    }
  });
});
