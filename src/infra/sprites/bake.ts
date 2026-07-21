import { parseGrid, SpriteDefinition } from './grid';

/**
 * Bakes text-grid sprites onto canvases. Grids are parsed exactly once, here;
 * afterwards the renderer only ever blits the cached canvases, so the runtime
 * cost is the same as using decoded image files.
 */

type BakedCanvas = OffscreenCanvas | HTMLCanvasElement;

export class BakedSprite {
  private constructor(
    private readonly canvases: readonly BakedCanvas[],
    readonly width: number,
    readonly height: number,
  ) {}

  static bake(sprite: SpriteDefinition): BakedSprite {
    const canvases = sprite.frames.map((grid) => bakeFrame(grid, sprite.palette));
    const first = canvases[0];
    return new BakedSprite(canvases, first.width, first.height);
  }

  get frameCount(): number {
    return this.canvases.length;
  }

  /** The baked canvas for a frame index (wraps, so any index is safe). */
  frame(index: number): CanvasImageSource {
    return this.canvases[index % this.canvases.length];
  }
}

function bakeFrame(grid: SpriteDefinition['frames'][number], palette: SpriteDefinition['palette']): BakedCanvas {
  const { width, height, pixels } = parseGrid(grid, palette);
  const canvas = createCanvas(width, height);
  const ctx = canvas.getContext('2d') as CanvasRenderingContext2D | null;
  if (!ctx) throw new Error('2D context is not available for sprite baking');
  // The parser always allocates a plain ArrayBuffer; the cast satisfies the
  // DOM lib's stricter ImageData typing (which rejects SharedArrayBuffer).
  ctx.putImageData(new ImageData(pixels as Uint8ClampedArray<ArrayBuffer>, width, height), 0, 0);
  return canvas;
}

function createCanvas(width: number, height: number): BakedCanvas {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  return canvas;
}
