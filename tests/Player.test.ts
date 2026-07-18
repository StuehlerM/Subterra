import { describe, expect, it } from 'vitest';
import { Battery } from '../src/domain/Battery';
import { Cargo } from '../src/domain/Cargo';
import { DOWN, RIGHT } from '../src/domain/Direction';
import { Player } from '../src/domain/Player';
import { Vec2 } from '../src/domain/Vec2';
import { TileType } from '../src/domain/tiles';
import { worldFrom } from './helpers/worldFrom';

const MOVE_DURATION = 0.1;

function miner(tile: Vec2, options = {}): Player {
  return new Player(tile, { moveDuration: MOVE_DURATION, ...options });
}

describe('Player movement', () => {
  it('starts a move into an empty tile', () => {
    const world = worldFrom(['...', '...', '...']);
    const player = miner(new Vec2(0, 0));
    expect(player.tryStartMove(RIGHT, world)).toBe(true);
    expect(player.isMoving).toBe(true);
  });

  it('cannot start a new move while already moving', () => {
    const world = worldFrom(['...', '...']);
    const player = miner(new Vec2(0, 0));
    player.tryStartMove(RIGHT, world);
    expect(player.tryStartMove(DOWN, world)).toBe(false);
  });

  it('arrives at the target tile after enough time', () => {
    const world = worldFrom(['...']);
    const player = miner(new Vec2(0, 0));
    player.tryStartMove(RIGHT, world);
    player.update(MOVE_DURATION);
    expect(player.isMoving).toBe(false);
    expect(player.tile.equals(new Vec2(1, 0))).toBe(true);
  });

  it('interpolates render position halfway through a move', () => {
    const world = worldFrom(['...']);
    const player = miner(new Vec2(0, 0));
    player.tryStartMove(RIGHT, world);
    player.update(MOVE_DURATION / 2);
    const pos = player.renderPosition();
    expect(pos.x).toBeCloseTo(0.5, 5);
  });
});

describe('Player drilling', () => {
  it('drills through sand and removes it', () => {
    const world = worldFrom(['.s.']);
    const player = miner(new Vec2(0, 0));
    expect(player.tryStartMove(RIGHT, world)).toBe(true);
    expect(world.getTile(1, 0)).toBe(TileType.Empty);
  });

  it('is blocked by bedrock (non-diggable)', () => {
    const world = worldFrom(['.#.']);
    const player = miner(new Vec2(0, 0));
    expect(player.tryStartMove(RIGHT, world)).toBe(false);
    expect(world.getTile(1, 0)).toBe(TileType.Bedrock);
  });

  it('cannot drill ore harder than the drill strength', () => {
    const world = worldFrom(['.I']); // iron: hardness 2
    const player = miner(new Vec2(0, 0), { drillStrength: 1 });
    expect(player.tryStartMove(RIGHT, world)).toBe(false);
    expect(world.getTile(1, 0)).toBe(TileType.Iron);
  });

  it('collects ore value into cargo when strong enough', () => {
    const world = worldFrom(['.I']);
    const player = miner(new Vec2(0, 0), { drillStrength: 2 });
    expect(player.tryStartMove(RIGHT, world)).toBe(true);
    expect(player.cargo.count).toBe(1);
    expect(player.cargo.totalValue).toBe(12);
    expect(world.getTile(1, 0)).toBe(TileType.Empty);
  });

  it('cannot collect ore when cargo is full but can still walk', () => {
    const world = worldFrom(['.C.']); // coal in the way, empty beyond
    const player = miner(new Vec2(0, 0), { cargo: new Cargo(0) });
    expect(player.tryStartMove(RIGHT, world)).toBe(false); // ore blocked
    expect(world.getTile(1, 0)).toBe(TileType.Coal);
  });
});

describe('Player battery', () => {
  it('spends battery per drilled tile', () => {
    const world = worldFrom(['.s']);
    const player = miner(new Vec2(0, 0), { battery: new Battery(5) });
    player.tryStartMove(RIGHT, world);
    expect(player.battery.current).toBe(4);
  });

  it('cannot drill on an empty battery', () => {
    const world = worldFrom(['.s']);
    const player = miner(new Vec2(0, 0), { battery: new Battery(0) });
    expect(player.tryStartMove(RIGHT, world)).toBe(false);
    expect(world.getTile(1, 0)).toBe(TileType.Sand);
  });

  it('still walks through open tunnels on an empty battery', () => {
    const world = worldFrom(['..']);
    const player = miner(new Vec2(0, 0), { battery: new Battery(0) });
    expect(player.tryStartMove(RIGHT, world)).toBe(true);
  });
});
