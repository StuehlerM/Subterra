import { describe, expect, it } from 'vitest';
import { Game } from '../src/app/Game';
import { RIGHT } from '../src/domain/Direction';
import { Player } from '../src/domain/Player';
import { Vec2 } from '../src/domain/Vec2';
import { worldFrom } from './helpers/worldFrom';

const MOVE_DURATION = 0.1;

function newGame(rows: string[]): Game {
  const world = worldFrom(rows);
  const player = new Player(new Vec2(0, 0), MOVE_DURATION);
  return new Game(world, player);
}

describe('Game', () => {
  it('starts a move when a direction is held and the player is idle', () => {
    const game = newGame(['...']);
    game.step(MOVE_DURATION / 2, RIGHT);
    expect(game.player.isMoving).toBe(true);
  });

  it('does not start a move when no direction is requested', () => {
    const game = newGame(['...']);
    game.step(MOVE_DURATION, null);
    expect(game.player.isMoving).toBe(false);
  });

  it('digs continuously across sand while a direction is held', () => {
    const game = newGame(['.sss#']);
    // Four full-tile steps should carry the miner from x=0 across the sand.
    for (let i = 0; i < 8; i++) {
      game.step(MOVE_DURATION, RIGHT);
    }
    expect(game.player.tile.x).toBe(3);
    expect(game.player.isMoving).toBe(false);
  });
});
