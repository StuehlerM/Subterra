import { describe, expect, it } from 'vitest';
import { DOWN, RIGHT } from '../src/domain/Direction';
import { Player } from '../src/domain/Player';
import { Vec2 } from '../src/domain/Vec2';
import { World } from '../src/domain/World';
import { TileType } from '../src/domain/tiles';

const MOVE_DURATION = 0.1;

function openWorld(): World {
  // 5x5 all-empty interior surrounded by bedrock border.
  return World.generate(5, 5, 1, { pillarChance: 0, spawn: new Vec2(1, 1) });
}

describe('Player', () => {
  it('starts a move into a walkable tile', () => {
    const world = openWorld();
    const player = new Player(new Vec2(1, 1), MOVE_DURATION);
    expect(player.tryStartMove(RIGHT, world)).toBe(true);
    expect(player.isMoving).toBe(true);
  });

  it('refuses to move into a solid tile', () => {
    const world = openWorld();
    world.setTile(2, 1, TileType.Bedrock);
    const player = new Player(new Vec2(1, 1), MOVE_DURATION);
    expect(player.tryStartMove(RIGHT, world)).toBe(false);
    expect(player.isMoving).toBe(false);
  });

  it('cannot start a new move while already moving', () => {
    const world = openWorld();
    const player = new Player(new Vec2(1, 1), MOVE_DURATION);
    player.tryStartMove(RIGHT, world);
    expect(player.tryStartMove(DOWN, world)).toBe(false);
  });

  it('arrives at the target tile after enough time', () => {
    const world = openWorld();
    const player = new Player(new Vec2(1, 1), MOVE_DURATION);
    player.tryStartMove(RIGHT, world);
    player.update(MOVE_DURATION);
    expect(player.isMoving).toBe(false);
    expect(player.tile.equals(new Vec2(2, 1))).toBe(true);
  });

  it('interpolates render position halfway through a move', () => {
    const world = openWorld();
    const player = new Player(new Vec2(1, 1), MOVE_DURATION);
    player.tryStartMove(RIGHT, world);
    player.update(MOVE_DURATION / 2);
    const pos = player.renderPosition();
    expect(pos.x).toBeCloseTo(1.5, 5);
    expect(pos.y).toBeCloseTo(1, 5);
  });

  it('does nothing on update while idle', () => {
    const player = new Player(new Vec2(1, 1), MOVE_DURATION);
    player.update(1);
    expect(player.tile.equals(new Vec2(1, 1))).toBe(true);
    expect(player.isMoving).toBe(false);
  });
});
