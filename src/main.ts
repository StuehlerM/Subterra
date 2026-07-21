import { AppFlow, Screen } from './app/AppFlow';
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
import { Game } from './app/Game';
import { ShopMenu } from './app/ShopMenu';
import { Player } from './domain/Player';
import { PlayerProgress } from './domain/PlayerProgress';
import { World } from './domain/World';
import { AssetRegistry } from './infra/AssetRegistry';
import { CanvasRenderer } from './infra/CanvasRenderer';
import { FogOfWar } from './infra/FogOfWar';
import { InputController } from './infra/InputController';
import { SaveRepository, SLOT_COUNT } from './infra/SaveRepository';
import { HudPainter } from './infra/ui/HudPainter';
import { ScreenPainters } from './infra/ui/ScreenPainters';
import { ShopPainter } from './infra/ui/ShopPainter';
import { UiAssets } from './infra/ui/UiAssets';
import { UiPainter } from './infra/ui/UiPainter';

const SAVE_KEY = 'deep-diggers-save-v1';

/** Everything belonging to one running game (one save slot). */
interface Session {
  readonly slot: number;
  readonly seed: number;
  readonly game: Game;
  readonly menu: ShopMenu;
  readonly fog: FogOfWar;
  wasMenuOpen: boolean;
}

function rollSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

function startSession(save: SaveRepository, slot: number): Session {
  const stored = save.loadSlot(slot);
  const seed = stored?.seed ?? rollSeed();
  const progress = stored?.progress ?? new PlayerProgress();
  if (!stored) save.saveSlot(slot, seed, progress); // claim the slot right away

  const { world, batSpawns, portalSpawns } = World.generateMap(WORLD_WIDTH, WORLD_HEIGHT, seed, {
    surfaceRows: SURFACE_ROWS,
    spawn: SPAWN_TILE,
  });
  const player = new Player(SPAWN_TILE);
  const game = new Game(world, player, progress, SURFACE_ROWS, SPAWN_TILE, batSpawns, portalSpawns);
  const menu = new ShopMenu(game, () => save.saveSlot(slot, seed, progress));
  return { slot, seed, game, menu, fog: new FogOfWar(WORLD_WIDTH, WORLD_HEIGHT), wasMenuOpen: false };
}

/** Routes edge-triggered keys while playing: shop menu vs gameplay actions. */
function handlePlayingActions(session: Session, input: InputController): void {
  const { game, menu } = session;
  if (game.isMenuOpen()) {
    let nav = input.consumeNav();
    while (nav) {
      menu.navigate(nav);
      nav = input.consumeNav();
    }
    if (input.consumeConfirm()) menu.confirm();
    if (input.consumeDynamite()) game.closeMenu(); // Z is a quick "drill again"
  } else {
    while (input.consumeNav()) {
      /* discard buffered nav during play */
    }
    if (input.consumeDynamite()) game.placeDynamite();
    if (input.consumeConfirm()) game.useFlare();
  }
}

/** Routes keys on the title / slot picker screens; returns a picked slot. */
function handleMenuActions(flow: AppFlow, input: InputController): number | null {
  let chosenSlot: number | null = null;
  let nav = input.consumeNav();
  while (nav) {
    if (nav.dx !== 0) flow.navigate(nav.dx as -1 | 1);
    nav = input.consumeNav();
  }
  if (input.consumeConfirm()) {
    const before: Screen = flow.screen;
    flow.pressConfirm();
    if (before === Screen.SlotSelect && flow.screen === Screen.Playing) {
      chosenSlot = flow.slotCursor;
    }
  }
  if (input.consumeDynamite()) flow.pressBack();
  return chosenSlot;
}

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
  save.migrateLegacy(SAVE_KEY, DEFAULT_SEED);

  const worldAssets = AssetRegistry.withDefaults();
  const renderer = new CanvasRenderer(ctx, worldAssets, TILE_SIZE);
  const ui = new UiPainter(ctx, UiAssets.withDefaults());
  const hud = new HudPainter(ctx, ui);
  const shop = new ShopPainter(ctx, ui);
  const screens = new ScreenPainters(ctx, ui, worldAssets);

  const flow = new AppFlow(SLOT_COUNT);
  const input = new InputController();
  input.attach(window);
  window.addEventListener('blur', () => flow.windowBlurred());

  const timestep = new FixedTimestep(FIXED_DT);
  let session: Session | null = null;

  let last = performance.now();
  const frame = (now: number) => {
    const frameDt = Math.min((now - last) / 1000, MAX_FRAME_DT);
    last = now;

    if (input.consumePause()) flow.pressPause();

    if (flow.screen === Screen.Playing && session) {
      stepGame(session, frameDt);
    } else if (flow.screen === Screen.Title || flow.screen === Screen.SlotSelect) {
      const chosen = handleMenuActions(flow, input);
      if (chosen !== null) session = startSession(save, chosen);
    } else {
      drainInput();
    }

    draw(now);
    requestAnimationFrame(frame);
  };

  const stepGame = (active: Session, frameDt: number): void => {
    const steps = timestep.advance(frameDt);
    for (let i = 0; i < steps; i++) {
      active.game.step(FIXED_DT, input.currentDirection());
    }
    handlePlayingActions(active, input);
    active.menu.update();

    // Save when the surface menu opens (i.e. on arrival, after auto-sell).
    const menuOpen = active.game.isMenuOpen();
    if (menuOpen && !active.wasMenuOpen) {
      save.saveSlot(active.slot, active.seed, active.game.progress);
    }
    active.wasMenuOpen = menuOpen;
  };

  const drainInput = (): void => {
    while (input.consumeNav()) {
      /* paused: ignore */
    }
    input.consumeConfirm();
    input.consumeDynamite();
  };

  const draw = (now: number): void => {
    switch (flow.screen) {
      case Screen.Title:
        screens.title(now);
        break;
      case Screen.SlotSelect:
        screens.slotSelect(save.slotSummaries(), flow.slotCursor, now);
        break;
      case Screen.Playing:
      case Screen.Paused:
        if (!session) break;
        renderer.render(session.game, session.fog);
        hud.draw(session.game);
        if (session.game.isMenuOpen()) shop.draw(session.game, session.menu);
        if (flow.screen === Screen.Paused) screens.pause();
        break;
    }
  };

  requestAnimationFrame(frame);
}

bootstrap();
