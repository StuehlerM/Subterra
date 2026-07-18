import { describe, expect, it } from 'vitest';
import { Bat, BatState } from '../src/domain/Bat';
import { Vec2 } from '../src/domain/Vec2';
import { worldFrom } from './helpers/worldFrom';

const FAST = 0.05;
const OPEN = worldFrom(['....................']); // one long open row

function stepMany(bat: Bat, seconds: number, playerTile: Vec2): boolean {
  const dt = 1 / 60;
  let hit = false;
  for (let t = 0; t < seconds; t += dt) {
    if (bat.update(dt, OPEN, playerTile).hitPlayer) hit = true;
  }
  return hit;
}

describe('Bat', () => {
  it('stays asleep until the miner is within wake range', () => {
    const bat = new Bat(new Vec2(10, 0), FAST);
    bat.update(0.1, OPEN, new Vec2(0, 0)); // far (distance 10)
    expect(bat.phase).toBe(BatState.Sleeping);
    bat.update(0.1, OPEN, new Vec2(7, 0)); // within 4
    expect(bat.phase).toBe(BatState.Chasing);
  });

  it('chases and can reach the miner (a touch)', () => {
    const bat = new Bat(new Vec2(3, 0), FAST);
    const hit = stepMany(bat, 1, new Vec2(0, 0));
    expect(hit).toBe(true);
  });

  it('tires and goes back to sleep after losing the miner', () => {
    const walled = worldFrom(['.#..................']); // bat penned in at (0,0)
    const bat = new Bat(new Vec2(0, 0), FAST);
    bat.update(0.1, walled, new Vec2(3, 0)); // wake within range
    expect(bat.phase).toBe(BatState.Chasing);
    const dt = 1 / 60;
    for (let t = 0; t < 4; t += dt) bat.update(dt, walled, new Vec2(19, 0)); // far & unreachable
    expect(bat.phase).toBe(BatState.Sleeping);
  });

  it('flees and vanishes after a flare', () => {
    const bat = new Bat(new Vec2(5, 0), FAST);
    bat.update(0.1, OPEN, new Vec2(4, 0)); // wake
    bat.startFleeing(new Vec2(4, 0));
    stepMany(bat, 1, new Vec2(4, 0));
    expect(bat.isGone).toBe(true);
  });
});
