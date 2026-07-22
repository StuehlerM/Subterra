import { describe, expect, it } from 'vitest';
import { PlayerProgress } from '../src/domain/economy/PlayerProgress';
import { UpgradeType, maxLevel, upgradeCost } from '../src/domain/economy/upgrades';

describe('PlayerProgress', () => {
  it('starts every upgrade at level 1', () => {
    const progress = new PlayerProgress();
    expect(progress.level(UpgradeType.DrillStrength)).toBe(1);
    expect(progress.drillStrength).toBe(1);
  });

  it('buys the next level when affordable', () => {
    const progress = new PlayerProgress(1000);
    const cost = upgradeCost(UpgradeType.DrillStrength, 1) as number;
    expect(progress.buy(UpgradeType.DrillStrength)).toBe(true);
    expect(progress.level(UpgradeType.DrillStrength)).toBe(2);
    expect(progress.money).toBe(1000 - cost);
    expect(progress.drillStrength).toBe(2);
  });

  it('refuses to buy without enough money', () => {
    const progress = new PlayerProgress(0);
    expect(progress.canBuy(UpgradeType.DrillStrength)).toBe(false);
    expect(progress.buy(UpgradeType.DrillStrength)).toBe(false);
    expect(progress.level(UpgradeType.DrillStrength)).toBe(1);
  });

  it('cannot buy beyond the max level', () => {
    const progress = new PlayerProgress(100000);
    const top = maxLevel(UpgradeType.DrillStrength);
    while (progress.level(UpgradeType.DrillStrength) < top) {
      progress.buy(UpgradeType.DrillStrength);
    }
    expect(progress.costToUpgrade(UpgradeType.DrillStrength)).toBeNull();
    expect(progress.buy(UpgradeType.DrillStrength)).toBe(false);
  });

  it('exposes blast radius that grows with the upgrade', () => {
    const progress = new PlayerProgress(10000);
    expect(progress.blastRadius).toBe(1);
    progress.buy(UpgradeType.BlastRadius);
    expect(progress.blastRadius).toBe(2);
    progress.buy(UpgradeType.BlastRadius);
    expect(progress.blastRadius).toBe(3);
    expect(progress.costToUpgrade(UpgradeType.BlastRadius)).toBeNull(); // maxed at 3
  });

  it('exposes flare capacity that grows with the upgrade', () => {
    const progress = new PlayerProgress(10000);
    expect(progress.flareCapacity).toBe(2);
    progress.buy(UpgradeType.FlareCapacity);
    expect(progress.flareCapacity).toBe(3);
  });

  it('round-trips through JSON', () => {
    const progress = new PlayerProgress(500);
    progress.buy(UpgradeType.CargoCapacity);
    const restored = PlayerProgress.fromJSON(progress.toJSON());
    expect(restored.money).toBe(progress.money);
    expect(restored.level(UpgradeType.CargoCapacity)).toBe(progress.level(UpgradeType.CargoCapacity));
    expect(restored.cargoCapacity).toBe(progress.cargoCapacity);
  });
});
