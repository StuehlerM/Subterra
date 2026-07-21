/**
 * Text-grid sprites: every sprite is a grid of characters plus a palette.
 * Each character is one pixel ('.' = transparent, letters look up a hex color).
 * This module is pure (no DOM) so it can be unit-tested headlessly; baking the
 * pixels onto a canvas lives in bake.ts.
 */

/** One sprite frame as rows of palette characters ('.' = transparent). */
export type TextureGrid = readonly string[];

/** Maps a grid character to a '#rrggbb' color. */
export type Palette = Readonly<Record<string, string>>;

export const TRANSPARENT_CHAR = '.';

/** A sprite: one or more animation frames drawn through one palette. */
export interface SpriteDefinition {
  readonly frames: readonly TextureGrid[];
  readonly palette: Palette;
}

export interface ParsedSprite {
  readonly width: number;
  readonly height: number;
  /** Row-major RGBA bytes, ready for ImageData. */
  readonly pixels: Uint8ClampedArray;
}

const RGBA_CHANNELS = 4;
const OPAQUE_ALPHA = 255;
const HEX_COLOR_PATTERN = /^#[0-9a-fA-F]{6}$/;

/** Parses a character grid through a palette into raw RGBA pixels. */
export function parseGrid(grid: TextureGrid, palette: Palette): ParsedSprite {
  if (grid.length === 0) throw new Error('Sprite grid is empty');
  const width = grid[0].length;
  const height = grid.length;
  const rgb = compilePalette(palette);
  const pixels = new Uint8ClampedArray(width * height * RGBA_CHANNELS);

  for (let y = 0; y < height; y++) {
    const row = grid[y];
    if (row.length !== width) {
      throw new Error(`Sprite row ${y} has length ${row.length}, expected ${width}`);
    }
    for (let x = 0; x < width; x++) {
      writePixel(pixels, (y * width + x) * RGBA_CHANNELS, row[x], rgb, x, y);
    }
  }
  return { width, height, pixels };
}

function writePixel(
  pixels: Uint8ClampedArray,
  offset: number,
  char: string,
  rgb: Map<string, readonly [number, number, number]>,
  x: number,
  y: number,
): void {
  if (char === TRANSPARENT_CHAR) return; // already zeroed (transparent)
  const color = rgb.get(char);
  if (!color) throw new Error(`Unknown sprite character '${char}' at (${x}, ${y})`);
  pixels[offset] = color[0];
  pixels[offset + 1] = color[1];
  pixels[offset + 2] = color[2];
  pixels[offset + 3] = OPAQUE_ALPHA;
}

function compilePalette(palette: Palette): Map<string, readonly [number, number, number]> {
  const rgb = new Map<string, readonly [number, number, number]>();
  for (const [char, hex] of Object.entries(palette)) {
    if (!HEX_COLOR_PATTERN.test(hex)) {
      throw new Error(`Palette entry '${char}' has invalid color '${hex}' (expected #rrggbb)`);
    }
    rgb.set(char, [
      parseInt(hex.slice(1, 3), 16),
      parseInt(hex.slice(3, 5), 16),
      parseInt(hex.slice(5, 7), 16),
    ]);
  }
  return rgb;
}
