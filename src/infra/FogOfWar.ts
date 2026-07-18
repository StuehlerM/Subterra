/**
 * Remembers which tiles the player has discovered. Unexplored tiles render
 * pitch black; explored tiles stay visible even after you leave. Rendering-only
 * (no effect on game rules). Reveal is a filled circle around a point.
 */
export class FogOfWar {
  private readonly explored: Uint8Array;
  private on = true;

  constructor(
    private readonly width: number,
    private readonly height: number,
  ) {
    this.explored = new Uint8Array(width * height);
  }

  get enabled(): boolean {
    return this.on;
  }

  toggle(): void {
    this.on = !this.on;
  }

  reveal(centerX: number, centerY: number, radius: number): void {
    const r2 = radius * radius;
    for (let dy = -radius; dy <= radius; dy++) {
      for (let dx = -radius; dx <= radius; dx++) {
        if (dx * dx + dy * dy > r2) continue;
        const x = centerX + dx;
        const y = centerY + dy;
        if (x >= 0 && y >= 0 && x < this.width && y < this.height) {
          this.explored[y * this.width + x] = 1;
        }
      }
    }
  }

  /** Whether a tile should be drawn. When disabled, everything is visible. */
  isVisible(x: number, y: number): boolean {
    if (!this.on) return true;
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    return this.explored[y * this.width + x] === 1;
  }
}
