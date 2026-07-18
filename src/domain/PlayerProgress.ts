import {
  ALL_UPGRADES,
  STARTING_LEVEL,
  UpgradeType,
  upgradeCost,
  upgradeValue,
} from './upgrades';

export interface PlayerProgressData {
  readonly money: number;
  readonly levels: Record<UpgradeType, number>;
}

/**
 * The persisted meta-progression: money in the bank and the level of each
 * upgrade. Derives the miner's effective stats from those levels, and knows how
 * to serialize itself for saving.
 */
export class PlayerProgress {
  private bank: number;
  private readonly levels: Record<UpgradeType, number>;

  constructor(money = 0, levels?: Partial<Record<UpgradeType, number>>) {
    this.bank = money;
    this.levels = PlayerProgress.defaultLevels();
    if (levels) {
      for (const type of ALL_UPGRADES) {
        if (typeof levels[type] === 'number') this.levels[type] = levels[type] as number;
      }
    }
  }

  get money(): number {
    return this.bank;
  }

  level(type: UpgradeType): number {
    return this.levels[type];
  }

  costToUpgrade(type: UpgradeType): number | null {
    return upgradeCost(type, this.levels[type]);
  }

  canBuy(type: UpgradeType): boolean {
    const cost = this.costToUpgrade(type);
    return cost !== null && this.bank >= cost;
  }

  addMoney(amount: number): void {
    this.bank += amount;
  }

  /** Buys the next level of `type` if affordable and not maxed. */
  buy(type: UpgradeType): boolean {
    const cost = this.costToUpgrade(type);
    if (cost === null || this.bank < cost) return false;
    this.bank -= cost;
    this.levels[type] += 1;
    return true;
  }

  get drillStrength(): number {
    return upgradeValue(UpgradeType.DrillStrength, this.levels[UpgradeType.DrillStrength]);
  }

  get moveDuration(): number {
    return upgradeValue(UpgradeType.DrillSpeed, this.levels[UpgradeType.DrillSpeed]);
  }

  get cargoCapacity(): number {
    return upgradeValue(UpgradeType.CargoCapacity, this.levels[UpgradeType.CargoCapacity]);
  }

  get batteryCapacity(): number {
    return upgradeValue(UpgradeType.BatteryCapacity, this.levels[UpgradeType.BatteryCapacity]);
  }

  get dynamiteCapacity(): number {
    return upgradeValue(UpgradeType.DynamiteCapacity, this.levels[UpgradeType.DynamiteCapacity]);
  }

  toJSON(): PlayerProgressData {
    return { money: this.bank, levels: { ...this.levels } };
  }

  static fromJSON(data: PlayerProgressData): PlayerProgress {
    return new PlayerProgress(data.money, data.levels);
  }

  private static defaultLevels(): Record<UpgradeType, number> {
    const levels = {} as Record<UpgradeType, number>;
    for (const type of ALL_UPGRADES) levels[type] = STARTING_LEVEL;
    return levels;
  }
}
