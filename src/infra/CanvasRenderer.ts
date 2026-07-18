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

/** Below this many seconds of fuse left, the dynamite blinks faster. */
const FUSE_URGENT_SECONDS = 0.6;
const BLINK_SLOW_MS = 260;
const BLINK_FAST_MS = 110;

/** Fog reveal radii (in tiles) around the player and around lit flares. */
const PLAYER_REVEAL_RADIUS = 4;
const FLARE_REVEAL_RADIUS = 5;
const UNDISCOVERED_COLOR = '#000000';

interface Camera {
  readonly x: number;
  readonly y: number;
}

/**
 * Draws the whole scene from the game state to a 2D canvas. The camera centers
 * on the player's (interpolated) position; only visible tiles are drawn.
 * Undiscovered tiles (per the fog) render pitch black; explored tiles stay
 * visible. Entities are hidden while on undiscovered tiles.
 */
export class CanvasRenderer {
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

    if (fog.enabled) this.revealAround(game, fog);

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawTiles(game.world, camera, canvas.width, canvas.height, fog);
    for (const flare of game.activeFlares) this.drawFlare(flare, camera);
    for (const rock of game.activeFallingRocks) {
      if (fog.isVisible(rock.tile.x, rock.tile.y)) this.drawFallingRock(rock, camera);
    }
    for (const dynamite of game.activeDynamites) {
      if (fog.isVisible(dynamite.tile.x, dynamite.tile.y)) this.drawDynamite(dynamite, camera);
    }
    for (const bat of game.activeBats) {
      if (fog.isVisible(bat.tile.x, bat.tile.y)) this.drawBat(bat, camera);
    }
    this.drawPlayer(center, camera);
    if (game.knockoutFlash > 0) this.drawKnockoutFlash(game.knockoutFlash);
  }

  private revealAround(game: Game, fog: FogOfWar): void {
    fog.reveal(game.player.tile.x, game.player.tile.y, PLAYER_REVEAL_RADIUS);
    for (const flare of game.activeFlares) {
      fog.reveal(flare.tile.x, flare.tile.y, FLARE_REVEAL_RADIUS);
    }
  }

  private drawTiles(world: World, camera: Camera, viewW: number, viewH: number, fog: FogOfWar): void {
    const minX = Math.floor(camera.x / this.tileSize);
    const minY = Math.floor(camera.y / this.tileSize);
    const maxX = Math.ceil((camera.x + viewW) / this.tileSize);
    const maxY = Math.ceil((camera.y + viewH) / this.tileSize);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        this.ctx.fillStyle = fog.isVisible(x, y)
          ? this.assets.tileStyle(world.getTile(x, y)).color
          : UNDISCOVERED_COLOR;
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
