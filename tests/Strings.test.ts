import { afterEach, describe, expect, it } from 'vitest';
import {
  LANGUAGES,
  coachHints,
  currentLanguage,
  setLanguage,
  str,
  tutorialHints,
  upgradeNames,
} from '../src/app/strings';

const COACH_LESSONS = ['rock', 'bat', 'batteryEmpty', 'supplyEmpty', 'cargoFull', 'portal'] as const;
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

  it('every language has a line for every coach lesson', () => {
    for (const lang of LANGUAGES) {
      setLanguage(lang);
      for (const lesson of COACH_LESSONS) {
        expect(coachHints()[lesson], `${lang} coach ${lesson}`).toBeTruthy();
      }
    }
  });

  it('every string in every language is drawable with the pixel font', () => {
    for (const lang of LANGUAGES) {
      setLanguage(lang);
      const all = [
        ...Object.values(str()),
        ...tutorialHints(),
        ...Object.values(upgradeNames()),
        ...Object.values(coachHints()),
      ];
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
