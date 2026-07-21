import { UpgradeType } from '../domain/upgrades';

/**
 * Every user-facing string in one place (uppercase only — the pixel font has
 * no lowercase). Translating the game later means swapping this file.
 */
export const STRINGS = {
  title: 'DEEP DIGGERS',
  pressX: 'PRESS X',
  newGame: 'NEW GAME',
  paused: 'PAUSED',
  drillAgain: 'DRILL AGAIN',
  pressM: 'PRESS M',
} as const;

/** Shown one at a time during a slot's first run (see app/Tutorial.ts). */
export const TUTORIAL_HINTS: readonly string[] = [
  'DIG DOWN WITH THE ARROWS!',
  'ORE! FILL YOUR CARGO!',
  'GO UP AND SELL AT THE TOP!',
  'BUY UPGRADES WITH X!',
  'DIG DEEP AND GET RICH!',
];

export const UPGRADE_NAMES: Record<UpgradeType, string> = {
  [UpgradeType.DrillStrength]: 'DRILL POWER',
  [UpgradeType.DrillSpeed]: 'DRILL SPEED',
  [UpgradeType.CargoCapacity]: 'CARGO',
  [UpgradeType.BatteryCapacity]: 'BATTERY',
  [UpgradeType.DynamiteCapacity]: 'DYNAMITE',
  [UpgradeType.BlastRadius]: 'BLAST SIZE',
  [UpgradeType.FlareCapacity]: 'FLARES',
};
