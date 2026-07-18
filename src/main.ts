import { Game } from './app/Game';
import {
  DEFAULT_SEED,
  FIXED_DT,
  MAX_FRAME_DT,
  SPAWN_TILE,
  SURFACE_ROWS,
  TILE_SIZE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './app/constants';
import { FixedTimestep } from './app/FixedTimestep';
import { Player } from './domain/Player';
import { PlayerProgress } from './domain/PlayerProgress';
import { World } from './domain/World';
import { AssetRegistry } from './infra/AssetRegistry';
import { CanvasRenderer } from './infra/CanvasRenderer';
import { Hud } from './infra/Hud';
import { InputController } from './infra/InputController';
import { SaveRepository } from './infra/SaveRepository';
import { Shop } from './infra/Shop';

const SAVE_KEY = 'deep-diggers-save-v1';

function bootstrap(): void {
  const canvas = document.getElementById('game') as HTMLCanvasElement;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas context is not available.');

  const resize = () => {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
  };
  resize();
  window.addEventListener('resize', resize);

  const save = new SaveRepository(SAVE_KEY, window.localStorage);
  const progress = save.load() ?? new PlayerProgress();

  const world = World.generate(WORLD_WIDTH, WORLD_HEIGHT, DEFAULT_SEED, {
    surfaceRows: SURFACE_ROWS,
    spawn: SPAWN_TILE,
  });
  const player = new Player(SPAWN_TILE);
  const game = new Game(world, player, progress, SURFACE_ROWS);

  const input = new InputController();
  input.attach(window);

  const renderer = new CanvasRenderer(ctx, AssetRegistry.withDefaults(), TILE_SIZE);
  const hud = new Hud(document.body);
  const shop = new Shop(document.body, game, () => save.save(progress));
  const timestep = new FixedTimestep(FIXED_DT);

  let wasMenuOpen = game.isMenuOpen();
  let last = performance.now();
  const frame = (now: number) => {
    const frameDt = Math.min((now - last) / 1000, MAX_FRAME_DT);
    last = now;

    const steps = timestep.advance(frameDt);
    for (let i = 0; i < steps; i++) {
      game.step(FIXED_DT, input.currentDirection());
    }
    handleActions(game, shop, input);

    // Save when the surface menu opens (i.e. on arrival, after auto-sell).
    const menuOpen = game.isMenuOpen();
    if (menuOpen && !wasMenuOpen) save.save(progress);
    wasMenuOpen = menuOpen;

    renderer.render(world, player, game.activeDynamites);
    hud.update(game);
    shop.update();
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

/**
 * Routes edge-triggered keys. While the surface menu is open, arrow presses
 * move the highlight and X confirms; otherwise Z places dynamite underground
 * (X/flare arrives in a later phase). Nav presses are always drained so they
 * never buffer during play.
 */
function handleActions(game: Game, shop: Shop, input: InputController): void {
  if (game.isMenuOpen()) {
    let nav = input.consumeNav();
    while (nav) {
      shop.navigate(nav);
      nav = input.consumeNav();
    }
    if (input.consumeConfirm()) shop.confirm();
    if (input.consumeDynamite()) game.closeMenu(); // Z is a quick "drill again"
  } else {
    while (input.consumeNav()) {
      /* discard buffered nav during play */
    }
    if (input.consumeDynamite()) game.placeDynamite();
    input.consumeConfirm();
  }
}

bootstrap();
