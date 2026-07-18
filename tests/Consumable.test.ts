import { describe, expect, it } from 'vitest';
import { Consumable } from '../src/domain/Consumable';

describe('Consumable', () => {
  it('starts full and uses one at a time', () => {
    const supply = new Consumable(3);
    expect(supply.remaining).toBe(3);
    expect(supply.tryUse()).toBe(true);
    expect(supply.remaining).toBe(2);
  });

  it('cannot be used when empty', () => {
    const supply = new Consumable(1);
    expect(supply.tryUse()).toBe(true);
    expect(supply.isEmpty).toBe(true);
    expect(supply.tryUse()).toBe(false);
  });

  it('restocks to capacity', () => {
    const supply = new Consumable(3);
    supply.tryUse();
    supply.tryUse();
    supply.restock();
    expect(supply.remaining).toBe(3);
  });

  it('raising capacity does not overfill current count', () => {
    const supply = new Consumable(3);
    supply.tryUse();
    supply.setCapacity(5);
    expect(supply.capacity).toBe(5);
    expect(supply.remaining).toBe(2);
  });
});
