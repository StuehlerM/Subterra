import { describe, expect, it } from 'vitest';
import { Game } from '../src/app/Game';
import { RIGHT } from '../src/domain/Direction';
import { Player } from '../src/domain/Player';
import { Vec2 } from '../src/domain/Vec2';
import { World } from '../src/domain/World';

const MOVE_DURATION = 0.1;

function newGame(): Game {
  const world = World.generate(5, 5, 1, { pillarChance: 0, spawn: new Vec2(1, 1) });
  const player = new Player(new Vec2(1, 1), MOVE_DURATION);
  return new Game(world, player);
}

describe('Game', () => {
  it('starts a move when a direction is held and the player is idle', () => {
    const game = newGame();
    game.step(MOVE_DURATION / 2, RIGHT);
    expect(game.player.isMoving).toBe(true);
  });

  it('does not start a move when no direction is requested', () => {
    const game = newGame();
    game.step(MOVE_DURATION, null);
    expect(game.player.isMoving).toBe(false);
  });

  it('moves continuously across tiles while a direction is held', () => {
    const game = newGame();
    // Enough fixed steps to traverse two tiles.
    for (let i = 0; i < 4; i++) {
      game.step(MOVE_DURATION, RIGHT);
    }
    expect(game.player.tile.x).toBeGreaterThanOrEqual(3);
  });
});
