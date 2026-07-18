import { Game } from '../app/Game';
import { Bat, BatState } from '../domain/Bat';
import { Dynamite } from '../domain/Dynamite';
import { FallingRock, RockState } from '../domain/FallingRock';
import { FLARE_RADIUS, Flare } from '../domain/Flare';
import { Vec2 } from '../domain/Vec2';
import { World } from '../domain/World';
import { TileType } from '../domain/tiles';
import { AssetRegistry } from './AssetRegistry';

/** Below this many seconds of fuse left, the dynamite blinks faster. */
const FUSE_URGENT_SECONDS = 0.6;
const BLINK_SLOW_MS = 260;
const BLINK_FAST_MS = 110;

// Fog of war (playtest): darkness alpha and torch/flare light radii (in tiles).
const FOG_DARKNESS = 0.9;
const PLAYER_LIGHT_INNER_TILES = 2;
const PLAYER_LIGHT_OUTER_TILES = 6;
const FLARE_LIGHT_INNER_TILES = 1;
const FLARE_LIGHT_OUTER_TILES = 5;

interface Camera {
  readonly x: number;
  readonly y: number;
}

/**
 * Draws the whole scene from the game state to a 2D canvas. The camera centers
 * on the player's (interpolated) position; only visible tiles are drawn.
 */
export class CanvasRenderer {
  private readonly fog = document.createElement('canvas');
  private readonly fogCtx = this.fog.getContext('2d')!;

  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly assets: AssetRegistry,
    private readonly tileSize: number,
  ) {}

  render(game: Game): void {
    const { canvas } = this.ctx;
    const center = game.player.renderPosition();
    const camera: Camera = {
      x: center.x * this.tileSize + this.tileSize / 2 - canvas.width / 2,
      y: center.y * this.tileSize + this.tileSize / 2 - canvas.height / 2,
    };

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawTiles(game.world, camera, canvas.width, canvas.height);
    for (const flare of game.activeFlares) this.drawFlare(flare, camera);
    for (const rock of game.activeFallingRocks) this.drawFallingRock(rock, camera);
    for (const dynamite of game.activeDynamites) this.drawDynamite(dynamite, camera);
    for (const bat of game.activeBats) this.drawBat(bat, camera);
    this.drawPlayer(center, camera);
    this.drawFog(game, camera);
    if (game.knockoutFlash > 0) this.drawKnockoutFlash(game.knockoutFlash);
  }

  /** Darkens everything beyond a torch radius around the miner; flares light up. */
  private drawFog(game: Game, camera: Camera): void {
    const { canvas } = this.ctx;
    if (this.fog.width !== canvas.width || this.fog.height !== canvas.height) {
      this.fog.width = canvas.width;
      this.fog.height = canvas.height;
    }
    const f = this.fogCtx;
    f.clearRect(0, 0, canvas.width, canvas.height);
    f.fillStyle = `rgba(6,6,12,${FOG_DARKNESS})`;
    f.fillRect(0, 0, canvas.width, canvas.height);

    // Punch holes of light (destination-out erases darkness on this offscreen layer only).
    f.globalCompositeOperation = 'destination-out';
    this.punchLight(canvas.width / 2, canvas.height / 2, PLAYER_LIGHT_INNER_TILES, PLAYER_LIGHT_OUTER_TILES);
    for (const flare of game.activeFlares) {
      const fx = flare.tile.x * this.tileSize - camera.x + this.tileSize / 2;
      const fy = flare.tile.y * this.tileSize - camera.y + this.tileSize / 2;
      this.punchLight(fx, fy, FLARE_LIGHT_INNER_TILES, FLARE_LIGHT_OUTER_TILES, flare.intensity);
    }
    f.globalCompositeOperation = 'source-over';

    this.ctx.drawImage(this.fog, 0, 0);
  }

  private punchLight(x: number, y: number, innerTiles: number, outerTiles: number, strength = 1): void {
    const inner = innerTiles * this.tileSize;
    const outer = outerTiles * this.tileSize;
    const gradient = this.fogCtx.createRadialGradient(x, y, inner, x, y, outer);
    gradient.addColorStop(0, `rgba(0,0,0,${strength})`);
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    this.fogCtx.fillStyle = gradient;
    this.fogCtx.fillRect(x - outer, y - outer, outer * 2, outer * 2);
  }

  private drawTiles(world: World, camera: Camera, viewW: number, viewH: number): void {
    const minX = Math.floor(camera.x / this.tileSize);
    const minY = Math.floor(camera.y / this.tileSize);
    const maxX = Math.ceil((camera.x + viewW) / this.tileSize);
    const maxY = Math.ceil((camera.y + viewH) / this.tileSize);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        this.ctx.fillStyle = this.assets.tileStyle(world.getTile(x, y)).color;
        this.ctx.fillRect(
          Math.round(x * this.tileSize - camera.x),
          Math.round(y * this.tileSize - camera.y),
          this.tileSize,
          this.tileSize,
        );
      }
    }
  }

  private drawFallingRock(rock: FallingRock, camera: Camera): void {
    const wobble =
      rock.phase === RockState.Wobbling ? Math.sin(performance.now() / 40) * (this.tileSize * 0.08) : 0;
    const px = Math.round(rock.tile.x * this.tileSize - camera.x + wobble);
    const py = Math.round((rock.tile.y + rock.fallProgress) * this.tileSize - camera.y);
    this.ctx.fillStyle = this.assets.tileStyle(TileType.Rock).color;
    this.ctx.fillRect(px, py, this.tileSize, this.tileSize);
  }

  private drawDynamite(dynamite: Dynamite, camera: Camera): void {
    const px = Math.round(dynamite.tile.x * this.tileSize - camera.x);
    const py = Math.round(dynamite.tile.y * this.tileSize - camera.y);
    const blinkMs = dynamite.fuseRemaining < FUSE_URGENT_SECONDS ? BLINK_FAST_MS : BLINK_SLOW_MS;
    const lit = Math.floor(performance.now() / blinkMs) % 2 === 0;

    const inset = Math.round(this.tileSize * 0.2);
    this.ctx.fillStyle = lit ? '#ff5a3c' : '#b53218';
    this.ctx.fillRect(px + inset, py + inset, this.tileSize - inset * 2, this.tileSize - inset * 2);
    this.ctx.fillStyle = lit ? '#ffe36e' : '#8a6a1e';
    this.ctx.fillRect(px + this.tileSize / 2 - 2, py + inset - 4, 4, 5);
  }

  private drawBat(bat: Bat, camera: Camera): void {
    const p = bat.renderPosition();
    const cx = p.x * this.tileSize - camera.x + this.tileSize / 2;
    const cy = p.y * this.tileSize - camera.y + this.tileSize / 2;
    this.ctx.save();
    this.ctx.globalAlpha = bat.phase === BatState.Sleeping ? 0.55 : bat.phase === BatState.Fleeing ? 0.5 : 1;
    this.ctx.font = `${Math.floor(this.tileSize * 0.8)}px serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(bat.phase === BatState.Sleeping ? '😴' : '🦇', cx, cy);
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

    this.ctx.font = `${Math.floor(this.tileSize * 0.8)}px serif`;
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText('🔥', cx, cy);
  }

  private drawPlayer(center: Vec2, camera: Camera): void {
    const padding = Math.round(this.tileSize * 0.12);
    this.ctx.fillStyle = this.assets.player;
    this.ctx.fillRect(
      Math.round(center.x * this.tileSize - camera.x) + padding,
      Math.round(center.y * this.tileSize - camera.y) + padding,
      this.tileSize - padding * 2,
      this.tileSize - padding * 2,
    );
  }

  private drawKnockoutFlash(intensity: number): void {
    const { canvas } = this.ctx;
    this.ctx.fillStyle = `rgba(200,0,0,${Math.min(1, intensity) * 0.5})`;
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
  }
}
