import { UpgradeType } from '../domain/upgrades';

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
}

const TABLES: Record<Language, UiStrings> = {
  en: {
    title: 'DEEP DIGGERS',
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
  },
  sv: {
    title: 'DEEP DIGGERS',
    pressX: 'TRYCK X',
    newGame: 'NYTT SPEL',
    paused: 'PAUS',
    drillAgain: 'BORRA!',
    pressM: 'TRYCK M',
    startGame: 'STARTA SPEL',
    options: 'ALTERNATIV',
    sound: 'LJUD',
    on: 'PÅ',
    off: 'AV',
    language: 'SPRÅK',
    languageName: 'SVENSKA',
    delete: 'RADERA',
    deleteConfirm: 'RADERA?',
    yes: 'JA',
    no: 'NEJ',
  },
  de: {
    title: 'DEEP DIGGERS',
    pressX: 'DRÜCK X',
    newGame: 'NEUES SPIEL',
    paused: 'PAUSE',
    drillAgain: 'BOHR!',
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
    'GÅ UPP OCH SÄLJ DÄR UPPE!',
    'KÖP UPPGRADERINGAR MED X!',
    'GRÄV DJUPT OCH BLI RIK!',
  ],
  de: [
    'GRAB NACH UNTEN MIT DEN PFEILEN!',
    'ERZ! FÜLL DEINE LADUNG!',
    'GEH HOCH UND VERKAUF OBEN!',
    'KAUF UPGRADES MIT X!',
    'GRAB TIEF UND WERDE REICH!',
  ],
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
