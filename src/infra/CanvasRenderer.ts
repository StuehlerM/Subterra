import { Game } from '../app/Game';
import { Bat, BatState } from '../domain/Bat';
import { Dynamite } from '../domain/Dynamite';
import { FallingRock, RockState } from '../domain/FallingRock';
import { FLARE_RADIUS, Flare } from '../domain/Flare';
import { Vec2 } from '../domain/Vec2';
import { World } from '../domain/World';
import { TileType, isOre } from '../domain/tiles';
import { AssetRegistry } from './AssetRegistry';
import { FogOfWar } from './FogOfWar';

/** Below this many seconds of fuse left, the dynamite blinks faster. */
const FUSE_URGENT_SECONDS = 0.6;
const BLINK_SLOW_MS = 260;
const BLINK_FAST_MS = 110;

/** Fog: clear within CLEAR tiles of the miner, fading to hidden by DIM (double). */
const CLEAR_RADIUS = 4;
const DIM_RADIUS = 8;
const FLARE_REVEAL_RADIUS = 5;
/** Colour of undiscovered ground (a soft navy, not pitch black). */
const HIDDEN_COLOR = '#0a0b16';

interface Camera {
  readonly x: number;
  readonly y: number;
}

interface TorchCell {
  readonly dx: number;
  readonly dy: number;
  readonly alpha: number;
}

/** Fixed blocky disc (in tile offsets) around the miner: clear core, 50% ring. */
function buildTorchPattern(): TorchCell[] {
  const cells: TorchCell[] = [];
  for (let dy = -DIM_RADIUS; dy <= DIM_RADIUS; dy++) {
    for (let dx = -DIM_RADIUS; dx <= DIM_RADIUS; dx++) {
      const d2 = dx * dx + dy * dy;
      if (d2 <= CLEAR_RADIUS * CLEAR_RADIUS) cells.push({ dx, dy, alpha: 1 });
      else if (d2 <= DIM_RADIUS * DIM_RADIUS) cells.push({ dx, dy, alpha: 0.5 });
    }
  }
  return cells;
}

/**
 * Draws the scene from the game state to a 2D canvas. The camera centers on the
 * miner's interpolated position. A fog mask (built on an offscreen canvas) keeps
 * explored tiles visible and reveals a smooth, fixed-shape circle around the
 * miner; everything else is hidden under a soft navy.
 */
export class CanvasRenderer {
  private readonly fog = document.createElement('canvas');
  private readonly fogCtx = this.fog.getContext('2d')!;
  private readonly torchPattern = buildTorchPattern();

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly assets: AssetRegistry,
    private readonly tileSize: number,
  ) {}

  render(game: Game, fog: FogOfWar): void {
    const { canvas } = this.ctx;
    const center = game.player.renderPosition();
    const camera: Camera = {
      x: center.x * this.tileSize + this.tileSize / 2 - canvas.width / 2,
      y: center.y * this.tileSize + this.tileSize / 2 - canvas.height / 2,
    };

    this.revealAround(game, fog);

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawTiles(game.world, camera, canvas.width, canvas.height);
    for (const portal of game.activePortals) this.drawPortal(portal, camera);
    for (const flare of game.activeFlares) this.drawFlare(flare, camera);
    for (const rock of game.activeFallingRocks) this.drawFallingRock(rock, camera);
    for (const dynamite of game.activeDynamites) this.drawDynamite(dynamite, camera);
    for (const bat of game.activeBats) this.drawBat(bat, camera);
    this.drawPlayer(center, camera);
    this.drawFogMask(camera, fog);
    if (game.knockoutFlash > 0) this.drawKnockoutFlash(game.knockoutFlash);
  }

  private revealAround(game: Game, fog: FogOfWar): void {
    fog.reveal(game.player.tile.x, game.player.tile.y, CLEAR_RADIUS);
    for (const flare of game.activeFlares) {
      fog.reveal(flare.tile.x, flare.tile.y, FLARE_REVEAL_RADIUS);
    }
  }

  private drawTiles(world: World, camera: Camera, viewW: number, viewH: number): void {
    const minX = Math.floor(camera.x / this.tileSize);
    const minY = Math.floor(camera.y / this.tileSize);
    const maxX = Math.ceil((camera.x + viewW) / this.tileSize);
    const maxY = Math.ceil((camera.y + viewH) / this.tileSize);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        const tile = world.getTile(x, y);
        const px = Math.round(x * this.tileSize - camera.x);
        const py = Math.round(y * this.tileSize - camera.y);
        // Fill a base colour first so transparent tile art composites over dirt
        // (ore/rock) or its own colour, never over bare black.
        this.ctx.fillStyle = this.tileBacking(tile);
        this.ctx.fillRect(px, py, this.tileSize, this.tileSize);
        const image = this.assets.tileImage(tile);
        if (image) this.ctx.drawImage(image, px, py, this.tileSize, this.tileSize);
      }
    }
  }

  /**
   * Builds the fog on an offscreen canvas: solid navy, then "erases" explored
   * tiles (blocky memory) and a smooth circle around the miner (screen center),
   * then composites it over the scene. The circle is drawn in pixels, so it is a
   * fixed shape that never wobbles as the miner moves sub-tile.
   */
  private drawFogMask(camera: Camera, fog: FogOfWar): void {
    const { canvas } = this.ctx;
    if (this.fog.width !== canvas.width || this.fog.height !== canvas.height) {
      this.fog.width = canvas.width;
      this.fog.height = canvas.height;
    }
    const f = this.fogCtx;
    f.globalCompositeOperation = 'source-over';
    f.fillStyle = HIDDEN_COLOR;
    f.fillRect(0, 0, canvas.width, canvas.height);

    f.globalCompositeOperation = 'destination-out';
    this.eraseExploredTiles(camera, fog);
    this.eraseTorch(canvas.width / 2, canvas.height / 2);
    f.globalCompositeOperation = 'source-over';

    this.ctx.drawImage(this.fog, 0, 0);
  }

  private eraseExploredTiles(camera: Camera, fog: FogOfWar): void {
    const f = this.fogCtx;
    f.fillStyle = 'rgba(0,0,0,1)';
    const minX = Math.floor(camera.x / this.tileSize);
    const minY = Math.floor(camera.y / this.tileSize);
    const maxX = Math.ceil((camera.x + this.fog.width) / this.tileSize);
    const maxY = Math.ceil((camera.y + this.fog.height) / this.tileSize);
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (!fog.isExplored(x, y)) continue;
        f.fillRect(
          Math.round(x * this.tileSize - camera.x),
          Math.round(y * this.tileSize - camera.y),
          this.tileSize,
          this.tileSize,
        );
      }
    }
  }

  private eraseTorch(cx: number, cy: number): void {
    const f = this.fogCtx;
    const ts = this.tileSize;
    const half = ts / 2;
    for (const cell of this.torchPattern) {
      f.fillStyle = `rgba(0,0,0,${cell.alpha})`;
      f.fillRect(Math.round(cx + cell.dx * ts - half), Math.round(cy + cell.dy * ts - half), ts, ts);
    }
  }

  private tileBacking(tile: TileType): string {
    const backing = isOre(tile) || tile === TileType.Rock ? TileType.Sand : tile;
    return this.assets.tileStyle(backing).color;
  }

  private drawPortal(tile: Vec2, camera: Camera): void {
    const cx = tile.x * this.tileSize - camera.x + this.tileSize / 2;
    const cy = tile.y * this.tileSize - camera.y + this.tileSize / 2;
    const radius = this.tileSize * 1.1;
    const pulse = 0.35 + 0.15 * Math.sin(performance.now() / 300);
    const gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, `rgba(168,91,216,${pulse})`);
    gradient.addColorStop(1, 'rgba(168,91,216,0)');
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.fill();

    const image = this.assets.entityImage('portal');
    if (image) {
      this.ctx.drawImage(
        image,
        Math.round(tile.x * this.tileSize - camera.x),
        Math.round(tile.y * this.tileSize - camera.y),
        this.tileSize,
        this.tileSize,
      );
    } else {
      this.ctx.font = `${Math.floor(this.tileSize * 0.8)}px serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('🌀', cx, cy);
    }
  }

  private drawFallingRock(rock: FallingRock, camera: Camera): void {
    const wobble =
      rock.phase === RockState.Wobbling ? Math.sin(performance.now() / 40) * (this.tileSize * 0.08) : 0;
    const px = Math.round(rock.tile.x * this.tileSize - camera.x + wobble);
    const py = Math.round((rock.tile.y + rock.fallProgress) * this.tileSize - camera.y);
    const image = this.assets.tileImage(TileType.Rock);
    if (image) {
      this.ctx.drawImage(image, px, py, this.tileSize, this.tileSize);
    } else {
      this.ctx.fillStyle = this.assets.tileStyle(TileType.Rock).color;
      this.ctx.fillRect(px, py, this.tileSize, this.tileSize);
    }
  }

  private drawDynamite(dynamite: Dynamite, camera: Camera): void {
    const px = Math.round(dynamite.tile.x * this.tileSize - camera.x);
    const py = Math.round(dynamite.tile.y * this.tileSize - camera.y);
    const blinkMs = dynamite.fuseRemaining < FUSE_URGENT_SECONDS ? BLINK_FAST_MS : BLINK_SLOW_MS;
    const lit = Math.floor(performance.now() / blinkMs) % 2 === 0;

    const image = this.assets.entityImage('dynamite');
    if (image) {
      this.ctx.save();
      this.ctx.globalAlpha = lit ? 1 : 0.7;
      this.ctx.drawImage(image, px, py, this.tileSize, this.tileSize);
      this.ctx.restore();
      return;
    }
    const inset = Math.round(this.tileSize * 0.2);
    this.ctx.fillStyle = lit ? '#ff5a3c' : '#b53218';
    this.ctx.fillRect(px + inset, py + inset, this.tileSize - inset * 2, this.tileSize - inset * 2);
    this.ctx.fillStyle = lit ? '#ffe36e' : '#8a6a1e';
    this.ctx.fillRect(px + this.tileSize / 2 - 2, py + inset - 4, 4, 5);
  }

  private drawBat(bat: Bat, camera: Camera): void {
    const p = bat.renderPosition();
    const px = Math.round(p.x * this.tileSize - camera.x);
    const py = Math.round(p.y * this.tileSize - camera.y);
    const asleep = bat.phase === BatState.Sleeping;
    this.ctx.save();
    this.ctx.globalAlpha = asleep ? 0.7 : bat.phase === BatState.Fleeing ? 0.5 : 1;
    const image = this.assets.entityImage(asleep ? 'bat_asleep' : 'bat');
    if (image) {
      this.ctx.drawImage(image, px, py, this.tileSize, this.tileSize);
    } else {
      this.ctx.font = `${Math.floor(this.tileSize * 0.8)}px serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText(asleep ? '😴' : '🦇', px + this.tileSize / 2, py + this.tileSize / 2);
    }
    this.ctx.restore();
  }

  private drawFlare(flare: Flare, camera: Camera): void {
    const cx = flare.tile.x * this.tileSize - camera.x + this.tileSize / 2;
    const cy = flare.tile.y * this.tileSize - camera.y + this.tileSize / 2;
    const radius = FLARE_RADIUS * this.tileSize;
    const gradient = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, radius);
    gradient.addColorStop(0, `rgba(255,231,110,${0.5 * flare.intensity})`);
    gradient.addColorStop(1, 'rgba(255,231,110,0)');
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.fill();

    const image = this.assets.entityImage('flare');
    if (image) {
      this.ctx.drawImage(
        image,
        Math.round(flare.tile.x * this.tileSize - camera.x),
        Math.round(flare.tile.y * this.tileSize - camera.y),
        this.tileSize,
        this.tileSize,
      );
    } else {
      this.ctx.font = `${Math.floor(this.tileSize * 0.8)}px serif`;
      this.ctx.textAlign = 'center';
      this.ctx.textBaseline = 'middle';
      this.ctx.fillText('🔥', cx, cy);
    }
  }

  private drawPlayer(center: Vec2, camera: Camera): void {
    const px = Math.round(center.x * this.tileSize - camera.x);
    const py = Math.round(center.y * this.tileSize - camera.y);
    const image = this.assets.entityImage('player');
    if (image) {
      this.ctx.drawImage(image, px, py, this.tileSize, this.tileSize);
      return;
    }
    const padding = Math.round(this.tileSize * 0.12);
    this.ctx.fillStyle = this.assets.player;
    this.ctx.fillRect(px + padding, py + padding, this.tileSize - padding * 2, this.tileSize - padding * 2);
  }

  private drawKnockoutFlash(intensity: number): void {
    const { canvas } = this.ctx;
    this.ctx.fillStyle = `rgba(200,0,0,${Math.min(1, intensity) * 0.5})`;
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}
