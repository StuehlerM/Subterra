import { describe, expect, it } from 'vitest';
import { Battery } from '../src/domain/economy/Battery';

describe('Battery', () => {
  it('starts full', () => {
    const battery = new Battery(30);
    expect(battery.current).toBe(30);
    expect(battery.isEmpty).toBe(false);
  });

  it('drains but never below zero', () => {
    const battery = new Battery(5);
    battery.drain(3);
    expect(battery.current).toBe(2);
    battery.drain(10);
    expect(battery.current).toBe(0);
    expect(battery.isEmpty).toBe(true);
  });

  it('refills to capacity', () => {
    const battery = new Battery(5);
    battery.drain(5);
    battery.refill();
    expect(battery.current).toBe(5);
  });

  it('raising capacity does not overfill current charge', () => {
    const battery = new Battery(5);
    battery.drain(2);
    battery.setCapacity(10);
    expect(battery.capacity).toBe(10);
    expect(battery.current).toBe(3);
  });
});
