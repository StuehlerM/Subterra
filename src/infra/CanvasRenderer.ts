import { Game } from '../app/Game';
import { Bat, BatState } from '../domain/Bat';
import { Dynamite } from '../domain/Dynamite';
import { FallingRock, RockState } from '../domain/FallingRock';
import { FLARE_RADIUS, Flare } from '../domain/Flare';
import { Vec2 } from '../domain/Vec2';
import { World } from '../domain/World';
import { TileType } from '../domain/tiles';
import { AssetRegistry } from './AssetRegistry';
import { FogOfWar } from './FogOfWar';
import { frameIndexAt } from './sprites/animation';
import { BakedSprite } from './sprites/bake';
import { variantIndexAt } from './sprites/variants';

/** Below this many seconds of fuse left, the dynamite blinks faster. */
const FUSE_URGENT_SECONDS = 0.6;
const BLINK_SLOW_MS = 260;
const BLINK_FAST_MS = 110;

/** Sprite art is authored at 16 pixels per tile; the renderer scales it up. */
const ART_PIXELS_PER_TILE = 16;
/** Idle animations (bats, flares, portals) flip frames at this rate. */
const FRAME_DURATION_MS = 250;
/** The miner's walk cycle swaps legs at this (faster) rate. */
const WALK_FRAME_MS = 120;

/** Fog: clear within CLEAR tiles of the miner, fading to hidden by DIM (double). */
const CLEAR_RADIUS = 4;
const DIM_RADIUS = 8;
const FLARE_REVEAL_RADIUS = 5;
/** Colour of undiscovered ground (a soft navy, not pitch black). */
const HIDDEN_COLOR = '#0a0b16';
/** Parallax factor for the backdrop (moves slower than the world). */
const BACKGROUND_PARALLAX = 0.5;

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
    this.ctx.imageSmoothingEnabled = false; // keep scaled pixel art crisp
    const center = game.player.renderPosition();
    const camera: Camera = {
      x: center.x * this.tileSize + this.tileSize / 2 - canvas.width / 2,
      y: center.y * this.tileSize + this.tileSize / 2 - canvas.height / 2,
    };

    this.revealAround(game, fog);

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawBackground(camera, game.surfaceRow);
    this.drawTiles(game.world, camera, canvas.width, canvas.height);
    for (const portal of game.activePortals) this.drawPortal(portal, camera);
    for (const flare of game.activeFlares) this.drawFlare(flare, camera);
    for (const rock of game.activeFallingRocks) this.drawFallingRock(rock, camera);
    for (const dynamite of game.activeDynamites) this.drawDynamite(dynamite, camera);
    for (const bat of game.activeBats) this.drawBat(bat, camera);
    this.drawPlayer(center, game.player.isMoving, camera);
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
        if (tile === TileType.Empty) continue; // open space: show the backdrop
        const sprite = this.assets.tile(tile);
        if (!sprite) continue;
        const px = Math.round(x * this.tileSize - camera.x);
        const py = Math.round(y * this.tileSize - camera.y);
        // Tiles with several grids are position-hashed variants, not animation.
        const variant = variantIndexAt(x, y, sprite.frameCount);
        // Draw the art as-is so its transparency shows through (no backing fill).
        this.ctx.drawImage(sprite.frame(variant), px, py, this.tileSize, this.tileSize);
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

  /**
   * Backdrop: a tiled cave layer everywhere, with the sky ramp stretched over
   * the region above the surface line. Open tiles are skipped so this shows
   * through them.
   */
  private drawBackground(camera: Camera, surfaceRow: number): void {
    const { canvas } = this.ctx;
    const surfaceY = Math.round(surfaceRow * this.tileSize - camera.y * BACKGROUND_PARALLAX);

    this.tileBackdrop(this.assets.background('cave'), camera);

    if (surfaceY > 0) {
      const sky = this.assets.background('sky');
      this.ctx.drawImage(sky.frame(0), 0, 0, canvas.width, surfaceY);
    }
  }

  private tileBackdrop(sprite: BakedSprite, camera: Camera): void {
    const { canvas } = this.ctx;
    const scale = this.tileSize / ART_PIXELS_PER_TILE;
    const iw = sprite.width * scale;
    const ih = sprite.height * scale;
    const startX = -((((camera.x * BACKGROUND_PARALLAX) % iw) + iw) % iw);
    const startY = -((((camera.y * BACKGROUND_PARALLAX) % ih) + ih) % ih);
    for (let y = startY; y < canvas.height; y += ih) {
      for (let x = startX; x < canvas.width; x += iw) {
        this.ctx.drawImage(sprite.frame(0), Math.round(x), Math.round(y), iw, ih);
      }
    }
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

    this.drawEntity('portal', tile.x, tile.y, camera);
  }

  /** Blits an entity sprite at a tile position, animating by wall-clock time. */
  private drawEntity(name: string, tileX: number, tileY: number, camera: Camera): void {
    const sprite = this.assets.entity(name);
    const frame = frameIndexAt(performance.now(), sprite.frameCount, FRAME_DURATION_MS);
    this.ctx.drawImage(
      sprite.frame(frame),
      Math.round(tileX * this.tileSize - camera.x),
      Math.round(tileY * this.tileSize - camera.y),
      this.tileSize,
      this.tileSize,
    );
  }

  private drawFallingRock(rock: FallingRock, camera: Camera): void {
    const wobble =
      rock.phase === RockState.Wobbling ? Math.sin(performance.now() / 40) * (this.tileSize * 0.08) : 0;
    const px = Math.round(rock.tile.x * this.tileSize - camera.x + wobble);
    const py = Math.round((rock.tile.y + rock.fallProgress) * this.tileSize - camera.y);
    const sprite = this.assets.tile(TileType.Rock);
    if (sprite) this.ctx.drawImage(sprite.frame(0), px, py, this.tileSize, this.tileSize);
  }

  private drawDynamite(dynamite: Dynamite, camera: Camera): void {
    const px = Math.round(dynamite.tile.x * this.tileSize - camera.x);
    const py = Math.round(dynamite.tile.y * this.tileSize - camera.y);
    // The spark frames flip at the blink rate; it speeds up as the fuse runs out.
    const blinkMs = dynamite.fuseRemaining < FUSE_URGENT_SECONDS ? BLINK_FAST_MS : BLINK_SLOW_MS;
    const sprite = this.assets.entity('dynamite');
    const frame = frameIndexAt(performance.now(), sprite.frameCount, blinkMs);
    this.ctx.drawImage(sprite.frame(frame), px, py, this.tileSize, this.tileSize);
  }

  private drawBat(bat: Bat, camera: Camera): void {
    const p = bat.renderPosition();
    const asleep = bat.phase === BatState.Sleeping;
    this.ctx.save();
    this.ctx.globalAlpha = asleep ? 0.85 : bat.phase === BatState.Fleeing ? 0.5 : 1;
    this.drawEntity(asleep ? 'bat_asleep' : 'bat', p.x, p.y, camera);
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

    this.drawEntity('flare', flare.tile.x, flare.tile.y, camera);
  }

  private drawPlayer(center: Vec2, moving: boolean, camera: Camera): void {
    const sprite = this.assets.entity('player');
    // Legs swap while walking/drilling; standing still always shows frame 0.
    const frame = moving ? frameIndexAt(performance.now(), sprite.frameCount, WALK_FRAME_MS) : 0;
    this.ctx.drawImage(
      sprite.frame(frame),
      Math.round(center.x * this.tileSize - camera.x),
      Math.round(center.y * this.tileSize - camera.y),
      this.tileSize,
      this.tileSize,
    );
  }

  private drawKnockoutFlash(intensity: number): void {
    const { canvas } = this.ctx;
    this.ctx.fillStyle = `rgba(200,0,0,${Math.min(1, intensity) * 0.5})`;
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}
