import { describe, expect, it } from 'vitest';
import { Cargo } from '../src/domain/economy/Cargo';
import { TileType } from '../src/domain/world/tiles';

describe('Cargo', () => {
  it('accumulates count and value', () => {
    const cargo = new Cargo(5);
    cargo.add(TileType.Coal, 3);
    cargo.add(TileType.Iron, 6);
    expect(cargo.count).toBe(2);
    expect(cargo.totalValue).toBe(9);
  });

  it('rejects items when full', () => {
    const cargo = new Cargo(1);
    expect(cargo.add(TileType.Coal, 3)).toBe(true);
    expect(cargo.isFull).toBe(true);
    expect(cargo.add(TileType.Iron, 6)).toBe(false);
    expect(cargo.totalValue).toBe(3);
  });

  it('clears back to empty', () => {
    const cargo = new Cargo(5);
    cargo.add(TileType.Coal, 3);
    cargo.clear();
    expect(cargo.isEmpty).toBe(true);
    expect(cargo.totalValue).toBe(0);
    expect(cargo.contents).toEqual([]);
  });

  it('raising capacity keeps carried ore and allows more', () => {
    const cargo = new Cargo(1);
    cargo.add(TileType.Coal, 3);
    cargo.setCapacity(2);
    expect(cargo.isFull).toBe(false);
    expect(cargo.add(TileType.Iron, 6)).toBe(true);
    expect(cargo.count).toBe(2);
  });

  it('knows what is inside, grouped by ore type', () => {
    const cargo = new Cargo(10);
    cargo.add(TileType.Coal, 1);
    cargo.add(TileType.Coal, 1);
    cargo.add(TileType.Gold, 25);
    cargo.add(TileType.Coal, 1);
    expect(cargo.contents).toEqual([
      { type: TileType.Coal, count: 3 },
      { type: TileType.Gold, count: 1 },
    ]);
  });

  it('rejected ore never shows up in the contents', () => {
    const cargo = new Cargo(1);
    cargo.add(TileType.Coal, 1);
    cargo.add(TileType.Gold, 25);
    expect(cargo.contents).toEqual([{ type: TileType.Coal, count: 1 }]);
  });
});
