import { describe, expect, it } from 'vitest';
import { Cargo } from '../src/domain/Cargo';
import { sellCargo } from '../src/domain/Economy';
import { PlayerProgress } from '../src/domain/PlayerProgress';

describe('sellCargo', () => {
  it('banks the cargo value and empties the hold', () => {
    const progress = new PlayerProgress(10);
    const cargo = new Cargo(5);
    cargo.add(4);
    cargo.add(6);
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
