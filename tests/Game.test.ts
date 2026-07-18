import { describe, expect, it } from 'vitest';
import { Game } from '../src/app/Game';
import { Battery } from '../src/domain/Battery';
import { Consumable } from '../src/domain/Consumable';
import { RIGHT, UP } from '../src/domain/Direction';
import { Player } from '../src/domain/Player';
import { PlayerProgress } from '../src/domain/PlayerProgress';
import { TileType } from '../src/domain/tiles';
import { UpgradeType } from '../src/domain/upgrades';
import { Vec2 } from '../src/domain/Vec2';
import { worldFrom } from './helpers/worldFrom';

const MOVE_DURATION = 0.1;
const SURFACE_ROWS = 1;
const FIXED_DT = 1 / 60;
const SPAWN = new Vec2(0, 0);

function newGame(rows: string[], tile: Vec2, options = {}, batSpawns: Vec2[] = []): Game {
  const world = worldFrom(rows);
  const player = new Player(tile, { moveDuration: MOVE_DURATION, ...options });
  return new Game(world, player, new PlayerProgress(), SURFACE_ROWS, SPAWN, batSpawns);
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

describe('Game surface menu', () => {
  it('opens the menu on arrival at the surface', () => {
    const game = newGame(['....', 'ssss'], new Vec2(0, 0));
    game.step(MOVE_DURATION, null);
    expect(game.isMenuOpen()).toBe(true);
  });

  it('keeps the menu closed while underground', () => {
    const game = newGame(['....', 'ssss'], new Vec2(0, 1));
    game.step(MOVE_DURATION, null);
    expect(game.isMenuOpen()).toBe(false);
  });

  it('freezes the miner while the menu is open', () => {
    const game = newGame(['....', 'ssss'], new Vec2(0, 0));
    game.step(MOVE_DURATION, null); // opens the menu
    game.step(MOVE_DURATION, RIGHT);
    expect(game.player.isMoving).toBe(false);
  });

  it('lets the miner move again after Drill again closes the menu', () => {
    const game = newGame(['....', 'ssss'], new Vec2(0, 0));
    game.step(MOVE_DURATION, null); // opens the menu
    game.closeMenu();
    game.step(MOVE_DURATION, RIGHT);
    expect(game.player.isMoving).toBe(true);
  });

  it('reopens the menu on the next surface arrival', () => {
    const game = newGame(['....', 'ssss', 'ssss'], new Vec2(0, 0));
    game.step(MOVE_DURATION, null); // opens
    game.closeMenu();
    game.player.tile = new Vec2(0, 1); // go underground
    game.step(MOVE_DURATION, null);
    expect(game.isMenuOpen()).toBe(false);
    game.player.tile = new Vec2(0, 0); // back to the surface
    game.step(MOVE_DURATION, null);
    expect(game.isMenuOpen()).toBe(true);
  });
});

describe('Game dynamite', () => {
  const FUSE_STEPS = 30; // more than enough fixed steps for the fuse to burn down

  it('places dynamite underground, consuming a stick', () => {
    const game = newGame(['....', 'sRss'], new Vec2(1, 1));
    const before = game.player.dynamite.remaining;
    expect(game.placeDynamite()).toBe(true);
    expect(game.player.dynamite.remaining).toBe(before - 1);
    expect(game.activeDynamites.length).toBe(1);
  });

  it('cannot place dynamite at the base', () => {
    const game = newGame(['....', 'sRss'], new Vec2(1, 0));
    expect(game.placeDynamite()).toBe(false);
  });

  it('cannot place dynamite with no supplies left', () => {
    const game = newGame(['....', 'sRss'], new Vec2(1, 1), { dynamite: new Consumable(0) });
    expect(game.placeDynamite()).toBe(false);
  });

  it('blasts nearby rock when the fuse burns out, leaving the miner unharmed', () => {
    const game = newGame(['....', '..R.'], new Vec2(1, 1)); // miner at empty (1,1), rock at (2,1)
    game.placeDynamite();
    for (let i = 0; i < FUSE_STEPS; i++) game.step(MOVE_DURATION, null);
    expect(game.activeDynamites.length).toBe(0);
    expect(game.world.getTile(2, 1)).toBe(TileType.Empty); // rock destroyed
    expect(game.player.tile.equals(new Vec2(1, 1))).toBe(true); // no friendly fire
  });

  it('restocks dynamite at the base', () => {
    const game = newGame(['....', 'sRss'], new Vec2(1, 1), { dynamite: new Consumable(3) });
    game.placeDynamite();
    game.player.tile = new Vec2(1, 0); // return to surface
    game.step(MOVE_DURATION, null);
    expect(game.player.dynamite.remaining).toBe(3);
  });
});

describe('Game falling rocks', () => {
  const STEPS = 120; // plenty for wobble + fall at 60 Hz

  it('drops an unsupported rock so it lands one tile lower', () => {
    // Column: rock, empty, sand floor. Rock at (0,1) has empty (0,2) below it.
    const game = newGame(['.', 'R', '.', 's'], new Vec2(0, 0), {});
    for (let i = 0; i < STEPS; i++) game.step(FIXED_DT, null);
    expect(game.world.getTile(0, 1)).toBe(TileType.Empty);
    expect(game.world.getTile(0, 2)).toBe(TileType.Rock);
    expect(game.activeFallingRocks.length).toBe(0);
  });

  it('knocks the miner out when a falling rock reaches its tile', () => {
    // Miner stands at (0,2); rock at (0,1) is unsupported and falls onto it.
    const game = newGame(['.', 'R', '.', 's'], new Vec2(0, 2), {});
    game.progress.addMoney(100);
    game.player.cargo.add(20);
    for (let i = 0; i < STEPS; i++) game.step(FIXED_DT, null);
    expect(game.player.tile.equals(SPAWN)).toBe(true); // respawned at surface
    expect(game.player.cargo.isEmpty).toBe(true); // lost this run's cargo
    expect(game.progress.money).toBe(100); // kept the bank
  });

  it('does not disturb a supported rock', () => {
    const game = newGame(['.', 'R', 's'], new Vec2(0, 0), {});
    for (let i = 0; i < STEPS; i++) game.step(FIXED_DT, null);
    expect(game.world.getTile(0, 1)).toBe(TileType.Rock);
    expect(game.activeFallingRocks.length).toBe(0);
  });

  it('frees a rock when the miner drills out the tile supporting it', () => {
    // Rock (0,1) rests on sand (0,2); miner at (0,3) drills up into that sand.
    const game = newGame(['.', 'R', 's', '.'], new Vec2(0, 3), {});
    expect(game.activeFallingRocks.length).toBe(0); // supported at start
    game.step(FIXED_DT, UP); // drills (0,2), freeing the rock above
    expect(game.activeFallingRocks.length).toBe(1);
  });
});

describe('Game blast radius upgrade', () => {
  const FUSE_STEPS = 120;
  // Miner stands in an empty pocket at (3,1) surrounded by sand; bedrock floor.
  const ROWS = ['.......', 'sss.sss', '#######'];

  function detonateAt(game: Game): void {
    game.placeDynamite();
    for (let i = 0; i < FUSE_STEPS; i++) game.step(FIXED_DT, null);
  }

  it('clears only the 3x3 area at blast level 1', () => {
    const game = newGame(ROWS, new Vec2(3, 1), {});
    detonateAt(game);
    expect(game.world.getTile(2, 1)).toBe(TileType.Empty); // distance 1: cleared
    expect(game.world.getTile(1, 1)).toBe(TileType.Sand); // distance 2: untouched
  });

  it('reaches distance 2 after buying the blast radius upgrade', () => {
    const game = newGame(ROWS, new Vec2(3, 1), {});
    game.progress.addMoney(1000);
    game.buyUpgrade(UpgradeType.BlastRadius);
    detonateAt(game);
    expect(game.world.getTile(1, 1)).toBe(TileType.Empty); // distance 2: now cleared
  });
});

describe('Game bats and flares', () => {
  const TUNNEL = ['........', '........', '########'];
  const STEPS = 220;

  it('a chasing bat that reaches the miner knocks them out', () => {
    const game = newGame(TUNNEL, new Vec2(6, 1), {}, [new Vec2(3, 1)]);
    game.progress.addMoney(50);
    game.player.cargo.add(10);
    for (let i = 0; i < STEPS; i++) game.step(FIXED_DT, null);
    expect(game.player.tile.equals(SPAWN)).toBe(true); // respawned
    expect(game.player.cargo.isEmpty).toBe(true); // lost the run's cargo
    expect(game.progress.money).toBe(50); // kept the bank
  });

  it('a flare banishes a nearby bat without harming the miner', () => {
    const game = newGame(TUNNEL, new Vec2(6, 1), {}, [new Vec2(3, 1)]);
    game.step(FIXED_DT, null); // bat wakes
    expect(game.useFlare()).toBe(true);
    for (let i = 0; i < STEPS; i++) game.step(FIXED_DT, null);
    expect(game.activeBats.length).toBe(0); // vanished
    expect(game.player.tile.equals(new Vec2(6, 1))).toBe(true); // not knocked out
  });

  it('lighting a flare consumes one and is refused at the base', () => {
    const underground = newGame(TUNNEL, new Vec2(6, 1), {});
    const before = underground.player.flare.remaining;
    expect(underground.useFlare()).toBe(true);
    expect(underground.player.flare.remaining).toBe(before - 1);

    const atBase = newGame(TUNNEL, new Vec2(0, 0), {});
    expect(atBase.useFlare()).toBe(false);
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
