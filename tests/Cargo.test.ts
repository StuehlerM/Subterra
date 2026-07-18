import { describe, expect, it } from 'vitest';
import { Cargo } from '../src/domain/Cargo';

describe('Cargo', () => {
  it('accumulates count and value', () => {
    const cargo = new Cargo(5);
    cargo.add(3);
    cargo.add(6);
    expect(cargo.count).toBe(2);
    expect(cargo.totalValue).toBe(9);
  });

  it('rejects items when full', () => {
    const cargo = new Cargo(1);
    expect(cargo.add(3)).toBe(true);
    expect(cargo.isFull).toBe(true);
    expect(cargo.add(6)).toBe(false);
    expect(cargo.totalValue).toBe(3);
  });

  it('clears back to empty', () => {
    const cargo = new Cargo(5);
    cargo.add(3);
    cargo.clear();
    expect(cargo.isEmpty).toBe(true);
    expect(cargo.totalValue).toBe(0);
  });

  it('raising capacity keeps carried ore and allows more', () => {
    const cargo = new Cargo(1);
    cargo.add(3);
    cargo.setCapacity(2);
    expect(cargo.isFull).toBe(false);
    expect(cargo.add(6)).toBe(true);
    expect(cargo.count).toBe(2);
  });
});
