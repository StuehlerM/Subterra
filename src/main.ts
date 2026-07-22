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
import { setLanguage, tutorialHints } from './app/strings';
import { Tutorial, TUTORIAL_DONE } from './app/Tutorial';
import { BatState } from './domain/Bat';
import { Player } from './domain/Player';
import { PlayerProgress } from './domain/PlayerProgress';
import { World } from './domain/World';
import { AssetRegistry } from './infra/AssetRegistry';
import { AudioDirector } from './infra/audio/AudioDirector';
import { AudioEngine } from './infra/audio/AudioEngine';
import { MuteStore } from './infra/audio/MuteStore';
import { CanvasRenderer } from './infra/CanvasRenderer';
import { FogOfWar } from './infra/FogOfWar';
import { InputController } from './infra/InputController';
import { LanguageStore } from './infra/LanguageStore';
import { SaveRepository, SLOT_COUNT } from './infra/SaveRepository';
import { HintPainter } from './infra/ui/HintPainter';
import { HudPainter } from './infra/ui/HudPainter';
import { ScreenPainters } from './infra/ui/ScreenPainters';
import { ShopPainter } from './infra/ui/ShopPainter';
import { UiAssets } from './infra/ui/UiAssets';
import { UiPainter } from './infra/ui/UiPainter';

const SAVE_KEY = 'subterra-save-v1';
const MUTE_KEY = 'subterra-muted';
const LANGUAGE_KEY = 'subterra-language';
/** Below this depth (in tiles) the sparse cave music takes over... */
const DEEP_MUSIC_DEPTH = 25;
/** ...and only above this depth does the mining theme come back (hysteresis). */
const MINING_MUSIC_DEPTH = 18;

/** Everything belonging to one running game (one save slot). */
interface Session {
  readonly slot: number;
  readonly seed: number;
  readonly game: Game;
  readonly menu: ShopMenu;
  readonly fog: FogOfWar;
  readonly tutorial: Tutorial;
  readonly audioDirector: AudioDirector;
  wasMenuOpen: boolean;
  boughtSomething: boolean;
}

function rollSeed(): number {
  return (Date.now() ^ Math.floor(Math.random() * 0xffffffff)) >>> 0;
}

function startSession(save: SaveRepository, slot: number, onPurchaseSound: () => void): Session {
  const stored = save.loadSlot(slot);
  const seed = stored?.seed ?? rollSeed();
  const progress = stored?.progress ?? new PlayerProgress();
  // Fresh slots get the tutorial; stored slots resume it (legacy = finished).
  const tutorial = new Tutorial(stored ? (stored.tutorialStep ?? TUTORIAL_DONE) : 0);
  if (!stored) save.saveSlot(slot, seed, progress, tutorial.step); // claim the slot

  const { world, batSpawns, portalSpawns } = World.generateMap(WORLD_WIDTH, WORLD_HEIGHT, seed, {
    surfaceRows: SURFACE_ROWS,
    spawn: SPAWN_TILE,
  });
  const player = new Player(SPAWN_TILE);
  const game = new Game(world, player, progress, SURFACE_ROWS, SPAWN_TILE, batSpawns, portalSpawns);
  const session: Session = {
    slot,
    seed,
    game,
    menu: new ShopMenu(game, () => {
      session.boughtSomething = true;
      onPurchaseSound();
      save.saveSlot(slot, seed, progress, session.tutorial.step);
    }),
    fog: new FogOfWar(WORLD_WIDTH, WORLD_HEIGHT),
    tutorial,
    audioDirector: new AudioDirector(),
    wasMenuOpen: false,
    boughtSomething: false,
  };
  return session;
}

/** Routes edge-triggered keys while playing: shop menu vs gameplay actions. */
function handlePlayingActions(session: Session, input: InputController, audio: AudioEngine): void {
  const { game, menu } = session;
  if (game.isMenuOpen()) {
    let nav = input.consumeNav();
    while (nav) {
      menu.navigate(nav);
      audio.playSfx('menu_move');
      nav = input.consumeNav();
    }
    if (input.consumeConfirm()) {
      audio.playSfx('menu_confirm');
      menu.confirm();
    }
    if (input.consumeDynamite()) game.closeMenu(); // Z is a quick "drill again"
  } else {
    while (input.consumeNav()) {
      /* discard buffered nav during play */
    }
    if (input.consumeDynamite()) game.placeDynamite();
    if (input.consumeConfirm()) game.useFlare();
  }
}

interface MenuActionResult {
  readonly chosenSlot: number | null;
  readonly deleteSlot: number | null;
}

/** Routes keys on the menu screens; reports picked/deleted slots. */
function handleMenuActions(
  flow: AppFlow,
  input: InputController,
  audio: AudioEngine,
  applyOption: (entry: number, step: -1 | 1) => void,
): MenuActionResult {
  let chosenSlot: number | null = null;
  let deleteSlot: number | null = null;
  let nav = input.consumeNav();
  while (nav) {
    if (nav.dy !== 0) {
      flow.moveVertical(nav.dy as -1 | 1);
      audio.playSfx('menu_move');
    } else if (nav.dx !== 0) {
      if (flow.screen === Screen.Options) applyOption(flow.optionsCursor, nav.dx as -1 | 1);
      else flow.navigate(nav.dx as -1 | 1);
      audio.playSfx('menu_move');
    }
    nav = input.consumeNav();
  }
  if (input.consumeConfirm()) {
    audio.playSfx('menu_confirm');
    if (flow.screen === Screen.Options) {
      applyOption(flow.optionsCursor, 1);
    } else {
      const before: Screen = flow.screen;
      flow.pressConfirm();
      if (before === Screen.SlotSelect && flow.screen === Screen.Playing) {
        chosenSlot = flow.slotCursor;
      }
      if (before === Screen.ConfirmDelete && flow.screen === Screen.SlotSelect) {
        deleteSlot = flow.slotCursor;
      }
    }
  }
  if (input.consumeDynamite()) flow.pressBack();
  return { chosenSlot, deleteSlot };
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
  const hud = new HudPainter(ctx, ui, worldAssets);
  const shop = new ShopPainter(ctx, ui);
  const hints = new HintPainter(ctx, ui);
  const screens = new ScreenPainters(ctx, ui, worldAssets);

  const audio = new AudioEngine(new MuteStore(MUTE_KEY, window.localStorage));
  const languages = new LanguageStore(LANGUAGE_KEY, window.localStorage);
  setLanguage(languages.language);
  const flow = new AppFlow(SLOT_COUNT);
  const input = new InputController();
  input.attach(window);
  window.addEventListener('blur', () => flow.windowBlurred());
  // Browsers only allow audio after a user gesture; the first key unlocks it.
  window.addEventListener('keydown', () => audio.unlock(), { once: true });

  const timestep = new FixedTimestep(FIXED_DT);
  let session: Session | null = null;

  let last = performance.now();
  const frame = (now: number) => {
    const frameDt = Math.min((now - last) / 1000, MAX_FRAME_DT);
    last = now;

    if (input.consumePause()) flow.pressPause();
    if (input.consumeMute()) audio.toggleMuted();

    if (flow.screen === Screen.Playing && session) {
      stepGame(session, frameDt);
    } else if (flow.screen === Screen.Paused) {
      drainInput();
    } else {
      flow.updateOccupancy(save.slotSummaries().map((s) => s !== null));
      const result = handleMenuActions(flow, input, audio, applyOption);
      if (result.deleteSlot !== null) save.deleteSlot(result.deleteSlot);
      if (result.chosenSlot !== null) {
        session = startSession(save, result.chosenSlot, () => audio.playSfx('upgrade'));
      }
    }

    audio.playMusic(chooseMusic());
    audio.keepPlaying();
    draw(now);
    requestAnimationFrame(frame);
  };

  /** Options entries: 0 = sound on/off, 1 = language cycle. */
  const applyOption = (entry: number, _step: -1 | 1): void => {
    if (entry === 0) audio.toggleMuted();
    else setLanguage(languages.cycle());
  };

  let inDeepMusic = false;
  const chooseMusic = (): string => {
    const inMenus = flow.screen !== Screen.Playing && flow.screen !== Screen.Paused;
    if (inMenus) return 'title';
    const depth = session ? session.game.depth() : 0;
    if (depth > DEEP_MUSIC_DEPTH) inDeepMusic = true;
    else if (depth < MINING_MUSIC_DEPTH) inDeepMusic = false;
    return inDeepMusic ? 'deep' : 'mining';
  };

  const stepGame = (active: Session, frameDt: number): void => {
    const steps = timestep.advance(frameDt);
    for (let i = 0; i < steps; i++) {
      active.game.step(FIXED_DT, input.currentDirection());
    }
    handlePlayingActions(active, input, audio);
    active.menu.update();

    for (const sound of active.audioDirector.update(snapshotFor(active))) {
      audio.playSfx(sound);
    }

    active.tutorial.update({
      underground: active.game.depth() > 0,
      hasOre: active.game.player.cargo.count > 0,
      shopOpen: active.game.isMenuOpen(),
      boughtSomething: active.boughtSomething,
      depth: active.game.depth(),
    });

    // Save when the surface menu opens (i.e. on arrival, after auto-sell).
    const menuOpen = active.game.isMenuOpen();
    if (menuOpen && !active.wasMenuOpen) {
      save.saveSlot(active.slot, active.seed, active.game.progress, active.tutorial.step);
    }
    active.wasMenuOpen = menuOpen;
  };

  const snapshotFor = (active: Session) => ({
    moving: active.game.player.isMoving,
    dug: active.game.player.justDug !== null,
    collected: active.game.player.justCollected,
    tileX: active.game.player.tile.x,
    tileY: active.game.player.tile.y,
    activeDynamites: active.game.activeDynamites.length,
    activeFlares: active.game.activeFlares.length,
    awakeBats: active.game.activeBats.filter((b) => b.phase !== BatState.Sleeping).length,
    knockoutFlash: active.game.knockoutFlash,
    menuOpen: active.game.isMenuOpen(),
    money: active.game.progress.money,
  });

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
        screens.title(flow.titleCursor, now);
        break;
      case Screen.Options:
        screens.options(flow.optionsCursor, audio.muted);
        break;
      case Screen.SlotSelect:
      case Screen.ConfirmDelete:
        screens.slotSelect(save.slotSummaries(), flow.slotCursor, flow.onDeleteRow, now);
        if (flow.screen === Screen.ConfirmDelete) screens.confirmDelete();
        break;
      case Screen.Playing:
      case Screen.Paused:
        if (!session) break;
        renderer.render(session.game, session.fog);
        hud.draw(session.game);
        hud.knockout(session.game.knockoutBanner);
        if (session.game.isMenuOpen()) shop.draw(session.game, session.menu);
        const hintIndex = session.tutorial.currentHintIndex();
        if (hintIndex !== null && flow.screen === Screen.Playing) {
          hints.draw(tutorialHints()[hintIndex]);
        }
        if (flow.screen === Screen.Paused) screens.pause(audio.muted);
        break;
    }
  };

  requestAnimationFrame(frame);
}

bootstrap();
