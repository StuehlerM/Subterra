import { describe, expect, it } from 'vitest';
import { DOWN, RIGHT } from '../src/domain/Direction';
import { Player } from '../src/domain/Player';
import { Vec2 } from '../src/domain/Vec2';
import { TileType } from '../src/domain/tiles';
import { worldFrom } from './helpers/worldFrom';

const MOVE_DURATION = 0.1;

describe('Player', () => {
  it('starts a move into an empty tile', () => {
    const world = worldFrom(['...', '...', '...']);
    const player = new Player(new Vec2(0, 0), MOVE_DURATION);
    expect(player.tryStartMove(RIGHT, world)).toBe(true);
    expect(player.isMoving).toBe(true);
  });

  it('drills through sand and removes it', () => {
    const world = worldFrom(['.s.']);
    const player = new Player(new Vec2(0, 0), MOVE_DURATION);
    expect(player.tryStartMove(RIGHT, world)).toBe(true);
    expect(world.getTile(1, 0)).toBe(TileType.Empty);
  });

  it('is blocked by bedrock (non-diggable)', () => {
    const world = worldFrom(['.#.']);
    const player = new Player(new Vec2(0, 0), MOVE_DURATION);
    expect(player.tryStartMove(RIGHT, world)).toBe(false);
    expect(player.isMoving).toBe(false);
    expect(world.getTile(1, 0)).toBe(TileType.Bedrock);
  });

  it('cannot start a new move while already moving', () => {
    const world = worldFrom(['...', '...']);
    const player = new Player(new Vec2(0, 0), MOVE_DURATION);
    player.tryStartMove(RIGHT, world);
    expect(player.tryStartMove(DOWN, world)).toBe(false);
  });

  it('arrives at the target tile after enough time', () => {
    const world = worldFrom(['...']);
    const player = new Player(new Vec2(0, 0), MOVE_DURATION);
    player.tryStartMove(RIGHT, world);
    player.update(MOVE_DURATION);
    expect(player.isMoving).toBe(false);
    expect(player.tile.equals(new Vec2(1, 0))).toBe(true);
  });

  it('interpolates render position halfway through a move', () => {
    const world = worldFrom(['...']);
    const player = new Player(new Vec2(0, 0), MOVE_DURATION);
    player.tryStartMove(RIGHT, world);
    player.update(MOVE_DURATION / 2);
    const pos = player.renderPosition();
    expect(pos.x).toBeCloseTo(0.5, 5);
    expect(pos.y).toBeCloseTo(0, 5);
  });

  it('does nothing on update while idle', () => {
    const player = new Player(new Vec2(1, 1), MOVE_DURATION);
    player.update(1);
    expect(player.tile.equals(new Vec2(1, 1))).toBe(true);
    expect(player.isMoving).toBe(false);
  });
});
