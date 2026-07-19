/**
 * Remembers which tiles the player has discovered. Explored tiles stay clear
 * even after you leave; the renderer dims/hides the rest based on distance.
 * Rendering-only (no effect on game rules).
 */
export class FogOfWar {
  private readonly explored: Uint8Array;

  constructor(
    private readonly width: number,
    private readonly height: number,
  ) {
    this.explored = new Uint8Array(width * height);
  }

  /** Marks a filled circle of tiles as discovered. */
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

  isExplored(x: number, y: number): boolean {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) return false;
    return this.explored[y * this.width + x] === 1;
  }
}
