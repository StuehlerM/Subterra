import { describe, expect, it } from 'vitest';
import { Game } from '../src/app/Game';
import { Battery } from '../src/domain/Battery';
import { RIGHT } from '../src/domain/Direction';
import { Player } from '../src/domain/Player';
import { PlayerProgress } from '../src/domain/PlayerProgress';
import { UpgradeType } from '../src/domain/upgrades';
import { Vec2 } from '../src/domain/Vec2';
import { worldFrom } from './helpers/worldFrom';

const MOVE_DURATION = 0.1;
const SURFACE_ROWS = 1;

function newGame(rows: string[], tile: Vec2, options = {}): Game {
  const world = worldFrom(rows);
  const player = new Player(tile, { moveDuration: MOVE_DURATION, ...options });
  return new Game(world, player, new PlayerProgress(), SURFACE_ROWS);
}

describe('Game movement', () => {
  it('starts a move when a direction is held and the player is idle', () => {
    const game = newGame(['....', 'ssss'], new Vec2(0, 1));
    game.step(MOVE_DURATION / 2, RIGHT);
    expect(game.player.isMoving).toBe(true);
  });

  it('does not start a move when no direction is requested', () => {
    const game = newGame(['....', 'ssss'], new Vec2(0, 1));
    game.step(MOVE_DURATION, null);
    expect(game.player.isMoving).toBe(false);
  });
});

describe('Game base economy', () => {
  it('reports being at base only on the surface rows', () => {
    const surface = newGame(['..', 'ss'], new Vec2(0, 0));
    const underground = newGame(['..', 'ss'], new Vec2(0, 1));
    expect(surface.isAtBase()).toBe(true);
    expect(underground.isAtBase()).toBe(false);
  });

  it('auto-sells cargo when at base', () => {
    const game = newGame(['..', 'ss'], new Vec2(0, 0));
    game.player.cargo.add(10);
    game.player.cargo.add(5);
    game.step(MOVE_DURATION, null);
    expect(game.player.cargo.isEmpty).toBe(true);
    expect(game.progress.money).toBe(15);
    expect(game.lastSaleAmount).toBe(15);
  });

  it('does not sell while underground', () => {
    const game = newGame(['..', 'ss'], new Vec2(0, 1));
    game.player.cargo.add(10);
    game.step(MOVE_DURATION, null);
    expect(game.progress.money).toBe(0);
    expect(game.player.cargo.count).toBe(1);
  });

  it('recharges the battery at base', () => {
    const game = newGame(['..', 'ss'], new Vec2(0, 0), { battery: new Battery(20) });
    game.player.battery.drain(20);
    expect(game.player.battery.isEmpty).toBe(true);
    game.step(MOVE_DURATION, null);
    expect(game.player.battery.current).toBe(game.player.battery.capacity);
  });

  it('reports depth below the surface', () => {
    const game = newGame(['..', 'ss', 'ss'], new Vec2(0, 2));
    expect(game.depth()).toBe(1);
  });
});

describe('Game upgrades', () => {
  it('buys an upgrade and applies it to the miner', () => {
    const game = newGame(['..', 'ss'], new Vec2(0, 0));
    game.progress.addMoney(1000);
    expect(game.buyUpgrade(UpgradeType.DrillStrength)).toBe(true);
    expect(game.player.drillStrength).toBe(2);
  });

  it('refuses upgrades that cannot be afforded', () => {
    const game = newGame(['..', 'ss'], new Vec2(0, 0));
    expect(game.buyUpgrade(UpgradeType.DrillStrength)).toBe(false);
    expect(game.player.drillStrength).toBe(1);
  });
});
