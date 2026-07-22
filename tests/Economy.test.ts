import { describe, expect, it } from 'vitest';
import { Cargo } from '../src/domain/economy/Cargo';
import { TileType } from '../src/domain/world/tiles';
import { sellCargo } from '../src/domain/economy/Economy';
import { PlayerProgress } from '../src/domain/economy/PlayerProgress';

describe('sellCargo', () => {
  it('banks the cargo value and empties the hold', () => {
    const progress = new PlayerProgress(10);
    const cargo = new Cargo(5);
    cargo.add(TileType.Coal, 4);
    cargo.add(TileType.Iron, 6);
    const earned = sellCargo(progress, cargo);
    expect(earned).toBe(10);
    expect(progress.money).toBe(20);
    expect(cargo.isEmpty).toBe(true);
  });

  it('earns nothing from an empty hold', () => {
    const progress = new PlayerProgress(5);
    expect(sellCargo(progress, new Cargo(5))).toBe(0);
    expect(progress.money).toBe(5);
  });
});
