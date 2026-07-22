import { UpgradeType } from '../domain/upgrades';
import type { CoachLesson } from './Coach';

/**
 * Every user-facing string in three languages (uppercase only — the pixel
 * font has no lowercase; German ß is written SS per all-caps convention).
 * The active language switches live via setLanguage().
 */

export type Language = 'en' | 'sv' | 'de';
export const LANGUAGES: readonly Language[] = ['en', 'sv', 'de'];

export interface UiStrings {
  readonly title: string;
  readonly pressX: string;
  readonly newGame: string;
  readonly paused: string;
  readonly drillAgain: string;
  readonly pressM: string;
  readonly startGame: string;
  readonly options: string;
  readonly sound: string;
  readonly on: string;
  readonly off: string;
  readonly language: string;
  readonly languageName: string;
  readonly delete: string;
  readonly deleteConfirm: string;
  readonly yes: string;
  readonly no: string;
  /** Controls legend (bottom-left during play). */
  readonly ctrlMove: string;
  readonly ctrlDynamite: string;
  readonly ctrlFlare: string;
  /** Shown big on a knock-out (rock or bat). */
  readonly ouch: string;
}

const TABLES: Record<Language, UiStrings> = {
  en: {
    title: 'SUBTERRA',
    pressX: 'PRESS X',
    newGame: 'NEW GAME',
    paused: 'PAUSED',
    drillAgain: 'DRILL!',
    pressM: 'PRESS M',
    startGame: 'START GAME',
    options: 'OPTIONS',
    sound: 'SOUND',
    on: 'ON',
    off: 'OFF',
    language: 'LANGUAGE',
    languageName: 'ENGLISH',
    delete: 'DELETE',
    deleteConfirm: 'DELETE?',
    yes: 'YES',
    no: 'NO',
    ctrlMove: 'MOVE',
    ctrlDynamite: 'DYNAMITE',
    ctrlFlare: 'FLARE',
    ouch: 'OUCH!',
  },
  sv: {
    title: 'SUBTERRA',
    pressX: 'TRYCK X',
    newGame: 'NYTT SPEL',
    paused: 'PAUS',
    drillAgain: 'BORRA!',
    pressM: 'TRYCK M',
    startGame: 'STARTA SPEL',
    options: 'INSTÄLLNINGAR',
    sound: 'LJUD',
    on: 'PÅ',
    off: 'AV',
    language: 'SPRÅK',
    languageName: 'SVENSKA',
    delete: 'RADERA',
    deleteConfirm: 'RADERA?',
    yes: 'JA',
    no: 'NEJ',
    ctrlMove: 'GÅ',
    ctrlDynamite: 'DYNAMIT',
    ctrlFlare: 'BLOSS',
    ouch: 'AJ!',
  },
  de: {
    title: 'SUBTERRA',
    pressX: 'DRÜCK X',
    newGame: 'NEUES SPIEL',
    paused: 'PAUSE',
    drillAgain: 'GLÜCK AUF!', // the classic German miners' greeting
    pressM: 'DRÜCK M',
    startGame: 'SPIEL STARTEN',
    options: 'OPTIONEN',
    sound: 'TON',
    on: 'AN',
    off: 'AUS',
    language: 'SPRACHE',
    languageName: 'DEUTSCH',
    delete: 'LÖSCHEN',
    deleteConfirm: 'LÖSCHEN?',
    yes: 'JA',
    no: 'NEIN',
    ctrlMove: 'GEHEN',
    ctrlDynamite: 'DYNAMIT',
    ctrlFlare: 'FACKEL',
    ouch: 'AUTSCH!',
  },
};

const TUTORIAL_TABLES: Record<Language, readonly string[]> = {
  en: [
    'DIG DOWN WITH THE ARROWS!',
    'ORE! FILL YOUR CARGO!',
    'GO UP AND SELL AT THE TOP!',
    'BUY UPGRADES WITH X!',
    'DIG DEEP AND GET RICH!',
  ],
  sv: [
    'GRÄV NER MED PILARNA!',
    'MALM! FYLL DIN LAST!',
    'GÅ UPP OCH SÄLJ!',
    'KÖP UPPGRADERINGAR MED X!',
    'GRÄV DJUPT OCH BLI RIK!',
  ],
  de: [
    'GRAB MIT DEN PFEILEN NACH UNTEN!',
    'ERZ! FÜLL DEINE LADUNG!',
    'GEH NACH OBEN UND VERKAUFE!',
    'KAUF UPGRADES MIT X!',
    'GRAB TIEF UND WERDE REICH!',
  ],
};

/**
 * Contextual-coach lines (keyed by lesson). Uppercase and glyph-safe: the
 * pixel font only draws A-Z, digits, / ! ? and Å Ä Ö Ü.
 */
const COACH_TABLES: Record<Language, Record<CoachLesson, string>> = {
  en: {
    rock: 'ROCK BLOCKS THE WAY! PRESS Z FOR DYNAMITE',
    bat: 'BATS AHEAD! PRESS X FOR A FLARE',
    batteryEmpty: 'BATTERY EMPTY! GO BACK UP TO RECHARGE',
    supplyEmpty: 'OUT OF SUPPLIES! GO BACK UP TO RESTOCK',
    cargoFull: 'CARGO FULL! GO BACK UP TO SELL',
    portal: 'A PORTAL! STEP IN TO WARP HOME WITH YOUR CARGO',
  },
  sv: {
    rock: 'STEN I VÄGEN! TRYCK Z FÖR DYNAMIT',
    bat: 'FLADDERMÖSS! TRYCK X FÖR EN FACKLA',
    batteryEmpty: 'BATTERIET TOMT! GÅ UPP OCH LADDA',
    supplyEmpty: 'SLUT PÅ FÖRRÅD! GÅ UPP OCH FYLL PÅ',
    cargoFull: 'LASTEN FULL! GÅ UPP OCH SÄLJ',
    portal: 'EN PORTAL! GÅ IN FÖR ATT RESA HEM MED LASTEN',
  },
  de: {
    rock: 'FELS VERSPERRT DEN WEG! DRÜCK Z FÜR DYNAMIT',
    bat: 'FLEDERMÄUSE! DRÜCK X FÜR EINE FACKEL',
    batteryEmpty: 'AKKU LEER! GEH NACH OBEN ZUM LADEN',
    supplyEmpty: 'VORRAT LEER! GEH NACH OBEN ZUM AUFFÜLLEN',
    cargoFull: 'LADUNG VOLL! GEH NACH OBEN ZUM VERKAUFEN',
    portal: 'EIN PORTAL! STEIG EIN UND REISE HEIM MIT LADUNG',
  },
};

const UPGRADE_TABLES: Record<Language, Record<UpgradeType, string>> = {
  en: {
    [UpgradeType.DrillStrength]: 'POWER',
    [UpgradeType.DrillSpeed]: 'SPEED',
    [UpgradeType.CargoCapacity]: 'CARGO',
    [UpgradeType.BatteryCapacity]: 'BATTERY',
    [UpgradeType.DynamiteCapacity]: 'DYNAMITE',
    [UpgradeType.BlastRadius]: 'BLAST',
    [UpgradeType.FlareCapacity]: 'FLARES',
  },
  sv: {
    [UpgradeType.DrillStrength]: 'KRAFT',
    [UpgradeType.DrillSpeed]: 'FART',
    [UpgradeType.CargoCapacity]: 'LAST',
    [UpgradeType.BatteryCapacity]: 'BATTERI',
    [UpgradeType.DynamiteCapacity]: 'DYNAMIT',
    [UpgradeType.BlastRadius]: 'SMÄLL',
    [UpgradeType.FlareCapacity]: 'BLOSS',
  },
  de: {
    [UpgradeType.DrillStrength]: 'KRAFT',
    [UpgradeType.DrillSpeed]: 'TEMPO',
    [UpgradeType.CargoCapacity]: 'LADUNG',
    [UpgradeType.BatteryCapacity]: 'BATTERIE',
    [UpgradeType.DynamiteCapacity]: 'DYNAMIT',
    [UpgradeType.BlastRadius]: 'KNALL',
    [UpgradeType.FlareCapacity]: 'FACKELN',
  },
};

let active: Language = 'en';

export function setLanguage(language: Language): void {
  active = language;
}

export function currentLanguage(): Language {
  return active;
}

/** The UI strings of the active language. */
export function str(): UiStrings {
  return TABLES[active];
}

/** The tutorial hints of the active language (index = tutorial step). */
export function tutorialHints(): readonly string[] {
  return TUTORIAL_TABLES[active];
}

/** The shop upgrade names of the active language. */
export function upgradeNames(): Record<UpgradeType, string> {
  return UPGRADE_TABLES[active];
}

/** The contextual-coach lines of the active language (keyed by lesson). */
export function coachHints(): Record<CoachLesson, string> {
  return COACH_TABLES[active];
}
