import { Player } from '../domain/Player';
import { World } from '../domain/World';
import { AssetRegistry } from './AssetRegistry';

/**
 * Draws the world and player to a 2D canvas. The camera centers on the player's
 * (interpolated) position and only visible tiles are drawn.
 */
export class CanvasRenderer {
  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly assets: AssetRegistry,
    private readonly tileSize: number,
  ) {}

  render(world: World, player: Player): void {
    const { canvas } = this.ctx;
    const center = player.renderPosition();
    const cameraX = center.x * this.tileSize + this.tileSize / 2 - canvas.width / 2;
    const cameraY = center.y * this.tileSize + this.tileSize / 2 - canvas.height / 2;

    this.ctx.clearRect(0, 0, canvas.width, canvas.height);
    this.drawTiles(world, cameraX, cameraY, canvas.width, canvas.height);
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
