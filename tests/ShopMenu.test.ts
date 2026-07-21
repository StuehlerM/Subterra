import { describe, expect, it } from 'vitest';
import { Game } from '../src/app/Game';
import { ShopMenu } from '../src/app/ShopMenu';
import { DOWN, LEFT, RIGHT, UP } from '../src/domain/Direction';
import { Player } from '../src/domain/Player';
import { PlayerProgress } from '../src/domain/PlayerProgress';
import { ALL_UPGRADES } from '../src/domain/upgrades';
import { Vec2 } from '../src/domain/Vec2';
import { worldFrom } from './helpers/worldFrom';

const FIXED_DT = 1 / 60;
const RICH = 100000;

/** A game whose miner sits at the base with the surface menu open. */
function openShop(money = RICH): { game: Game; menu: ShopMenu; purchases: () => number } {
  const world = worldFrom(['..', 'ss']);
  const player = new Player(new Vec2(0, 0));
  const game = new Game(world, player, new PlayerProgress(money), 1, new Vec2(0, 0), [], []);
  (game as unknown as { menuOpen: boolean }).menuOpen = true; // open the surface menu
  let count = 0;
  const menu = new ShopMenu(game, () => count++);
  menu.update();
  return { game, menu, purchases: () => count };
}

describe('ShopMenu navigation', () => {
  it('starts on the first upgrade, not on drill-again', () => {
    const { menu } = openShop();
    expect(menu.selectedIndex).toBe(0);
    expect(menu.onDrillAgain).toBe(false);
  });

  it('moves along the row and clamps at both ends', () => {
    const { menu } = openShop();
    menu.navigate(LEFT);
    expect(menu.selectedIndex).toBe(0);
    for (let i = 0; i < ALL_UPGRADES.length + 3; i++) menu.navigate(RIGHT);
    expect(menu.selectedIndex).toBe(ALL_UPGRADES.length - 1);
  });

  it('down selects drill-again, up returns to the row', () => {
    const { menu } = openShop();
    menu.navigate(DOWN);
    expect(menu.onDrillAgain).toBe(true);
    menu.navigate(LEFT); // sideways does nothing down there
    expect(menu.onDrillAgain).toBe(true);
    menu.navigate(UP);
    expect(menu.onDrillAgain).toBe(false);
    expect(menu.selectedIndex).toBe(0);
  });
});

describe('ShopMenu confirm', () => {
  it('buys the highlighted upgrade and reports the purchase', () => {
    const { game, menu, purchases } = openShop();
    const before = game.progress.money;
    menu.confirm();
    expect(game.progress.money).toBeLessThan(before);
    expect(purchases()).toBe(1);
  });

  it('does not report a purchase when the upgrade is unaffordable', () => {
    const { game, menu, purchases } = openShop(0);
    menu.confirm();
    expect(game.progress.money).toBe(0);
    expect(purchases()).toBe(0);
  });

  it('drill-again closes the menu without buying', () => {
    const { game, menu, purchases } = openShop();
    menu.navigate(DOWN);
    menu.confirm();
    expect(game.isMenuOpen()).toBe(false);
    expect(purchases()).toBe(0);
  });
});

describe('ShopMenu lifecycle', () => {
  it('resets the highlight each time the menu reopens', () => {
    const { game, menu } = openShop();
    menu.navigate(RIGHT);
    menu.navigate(DOWN);
    game.closeMenu();
    menu.update();
    game.step(FIXED_DT, DOWN); // dig away and come back...
    (game as unknown as { menuOpen: boolean }).menuOpen = true; // force reopen
    menu.update();
    expect(menu.selectedIndex).toBe(0);
    expect(menu.onDrillAgain).toBe(false);
  });
});
