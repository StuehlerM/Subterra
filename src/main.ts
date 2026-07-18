import { Game } from './app/Game';
import {
  DEFAULT_SEED,
  FIXED_DT,
  MAX_FRAME_DT,
  SPAWN_TILE,
  TILE_SIZE,
  WORLD_HEIGHT,
  WORLD_WIDTH,
} from './app/constants';
import { FixedTimestep } from './app/FixedTimestep';
import { Player } from './domain/Player';
import { World } from './domain/World';
import { AssetRegistry } from './infra/AssetRegistry';
import { CanvasRenderer } from './infra/CanvasRenderer';
import { InputController } from './infra/InputController';

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

  const world = World.generate(WORLD_WIDTH, WORLD_HEIGHT, DEFAULT_SEED, { spawn: SPAWN_TILE });
  const player = new Player(SPAWN_TILE);
  const game = new Game(world, player);

  const input = new InputController();
  input.attach(window);

  const renderer = new CanvasRenderer(ctx, AssetRegistry.withDefaults(), TILE_SIZE);
  const timestep = new FixedTimestep(FIXED_DT);

  let last = performance.now();
  const frame = (now: number) => {
    const frameDt = Math.min((now - last) / 1000, MAX_FRAME_DT);
    last = now;
    const steps = timestep.advance(frameDt);
    for (let i = 0; i < steps; i++) {
      game.step(FIXED_DT, input.currentDirection());
    }
    renderer.render(world, player);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
}

bootstrap();
