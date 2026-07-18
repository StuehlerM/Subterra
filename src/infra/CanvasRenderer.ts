import { Dynamite } from '../domain/Dynamite';
import { Player } from '../domain/Player';
import { World } from '../domain/World';
import { AssetRegistry } from './AssetRegistry';

/** Below this many seconds of fuse left, the dynamite blinks faster. */
const FUSE_URGENT_SECONDS = 0.6;
const BLINK_SLOW_MS = 260;
const BLINK_FAST_MS = 110;

/**
 * Draws the world, player and placed dynamite to a 2D canvas. The camera
 * centers on the player's (interpolated) position; only visible tiles are drawn.
 */
export class CanvasRenderer {
  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly assets: AssetRegistry,
    private readonly tileSize: number,
  ) {}

  render(world: World, player: Player, dynamites: readonly Dynamite[]): void {
    const { canvas } = this.ctx;
    const center = player.renderPosition();
    const cameraX = center.x * this.tileSize + this.tileSize / 2 - canvas.width / 2;
    const cameraY = center.y * this.tileSize + this.tileSize / 2 - canvas.height / 2;

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawTiles(world, cameraX, cameraY, canvas.width, canvas.height);
    for (const dynamite of dynamites) this.drawDynamite(dynamite, cameraX, cameraY);
    this.drawPlayer(center, cameraX, cameraY);
  }

  private drawTiles(world: World, cameraX: number, cameraY: number, viewW: number, viewH: number): void {
    const minX = Math.floor(cameraX / this.tileSize);
    const minY = Math.floor(cameraY / this.tileSize);
    const maxX = Math.ceil((cameraX + viewW) / this.tileSize);
    const maxY = Math.ceil((cameraY + viewH) / this.tileSize);

    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        this.ctx.fillStyle = this.assets.tileStyle(world.getTile(x, y)).color;
        this.ctx.fillRect(
          Math.round(x * this.tileSize - cameraX),
          Math.round(y * this.tileSize - cameraY),
          this.tileSize,
          this.tileSize,
        );
      }
    }
  }

  private drawDynamite(dynamite: Dynamite, cameraX: number, cameraY: number): void {
    const px = Math.round(dynamite.tile.x * this.tileSize - cameraX);
    const py = Math.round(dynamite.tile.y * this.tileSize - cameraY);
    const blinkMs = dynamite.fuseRemaining < FUSE_URGENT_SECONDS ? BLINK_FAST_MS : BLINK_SLOW_MS;
    const lit = Math.floor(performance.now() / blinkMs) % 2 === 0;

    const inset = Math.round(this.tileSize * 0.2);
    this.ctx.fillStyle = lit ? '#ff5a3c' : '#b53218';
    this.ctx.fillRect(px + inset, py + inset, this.tileSize - inset * 2, this.tileSize - inset * 2);
    // spark
    this.ctx.fillStyle = lit ? '#ffe36e' : '#8a6a1e';
    this.ctx.fillRect(px + this.tileSize / 2 - 2, py + inset - 4, 4, 5);
  }

  private drawPlayer(center: { x: number; y: number }, cameraX: number, cameraY: number): void {
    const padding = Math.round(this.tileSize * 0.12);
    this.ctx.fillStyle = this.assets.player;
    this.ctx.fillRect(
      Math.round(center.x * this.tileSize - cameraX) + padding,
      Math.round(center.y * this.tileSize - cameraY) + padding,
      this.tileSize - padding * 2,
      this.tileSize - padding * 2,
    );
  }
}
