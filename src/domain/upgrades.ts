export enum UpgradeType {
  DrillStrength = 'drillStrength',
  DrillSpeed = 'drillSpeed',
  CargoCapacity = 'cargoCapacity',
  BatteryCapacity = 'batteryCapacity',
  DynamiteCapacity = 'dynamiteCapacity',
  BlastRadius = 'blastRadius',
}

export interface UpgradeSpec {
  readonly label: string;
  /** Effect value at each level (index 0 = level 1). */
  readonly values: readonly number[];
  /** Money cost to go from level i+1 to level i+2 (length = values.length - 1). */
  readonly costs: readonly number[];
}

/** Every upgrade starts at level 1. */
export const STARTING_LEVEL = 1;

/**
 * Tuning tables for the buyable upgrades. `values` is the effect at each level;
 * `costs[level-1]` is what it takes to reach the next level.
 * - DrillStrength: max ore hardness the drill can break.
 * - DrillSpeed: seconds to traverse/drill one tile (lower is faster).
 * - CargoCapacity: ore pieces carried per run.
 * - BatteryCapacity: drill actions available before a recharge.
 * - DynamiteCapacity: sticks of dynamite carried per run.
 * - BlastRadius: Chebyshev radius of a dynamite blast (1=3x3, 2=5x5, 3=7x7).
 */
export const UPGRADE_CATALOG: Record<UpgradeType, UpgradeSpec> = {
  [UpgradeType.DrillStrength]: {
    label: 'Drill Strength',
    values: [1, 2, 3, 4, 5],
    costs: [50, 120, 250, 500],
  },
  [UpgradeType.DrillSpeed]: {
    label: 'Drill Speed',
    values: [0.14, 0.12, 0.1, 0.085, 0.07],
    costs: [40, 90, 180, 350],
  },
  [UpgradeType.CargoCapacity]: {
    label: 'Cargo',
    values: [8, 12, 18, 26, 40],
    costs: [30, 80, 160, 320],
  },
  [UpgradeType.BatteryCapacity]: {
    label: 'Battery',
    values: [30, 45, 65, 90, 120],
    costs: [30, 80, 160, 320],
  },
  [UpgradeType.DynamiteCapacity]: {
    label: 'Dynamite',
    values: [3, 4, 5, 6, 8],
    costs: [60, 140, 300, 600],
  },
  [UpgradeType.BlastRadius]: {
    label: 'Blast',
    values: [1, 2, 3],
    costs: [150, 400],
  },
};

export const ALL_UPGRADES: readonly UpgradeType[] = Object.values(UpgradeType);

export function maxLevel(type: UpgradeType): number {
  return UPGRADE_CATALOG[type].values.length;
}

export function upgradeValue(type: UpgradeType, level: number): number {
  return UPGRADE_CATALOG[type].values[level - 1];
}

/** Cost to advance from `level` to `level + 1`, or null if already maxed. */
export function upgradeCost(type: UpgradeType, level: number): number | null {
  if (level >= maxLevel(type)) return null;
  return UPGRADE_CATALOG[type].costs[level - 1];
}
