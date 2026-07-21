import { deflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { parseGrid } from '../../src/infra/sprites/grid';
// eslint-disable-next-line -- plain-JS tool modules with .d.mts declarations
import { chunk, encodePng } from '../../scripts/png.mjs';
import { convertPngToSprite, decodePng } from '../../scripts/png-to-grid.mjs';

const PALETTE = { g: '#6fae52', d: '#4a7a34', t: '#b1d67e' };

const TALL_GRASS = [
  '..t........t....',
  '..g..t.....g..t.',
  '..g..g.....g..g.',
  '.dg..gd...dg..gd',
  '.dgg.gd...dgg.gd',
];

/** Renders a grid through the game's own parser and encodes it as a PNG. */
function gridToPng(grid: readonly string[], palette: Record<string, string>): Buffer {
  const { width, height, pixels } = parseGrid(grid, palette);
  return encodePng(width, height, Buffer.from(pixels));
}

/** Two single-frame grids side by side as one horizontal strip PNG. */
function stripToPng(
  frames: readonly (readonly string[])[],
  palette: Record<string, string>,
): Buffer {
  const joined = frames[0].map((_, y) => frames.map((f) => f[y]).join(''));
  return gridToPng(joined, palette);
}

describe('decodePng', () => {
  it('is the inverse of encodePng for RGBA images', () => {
    const rgba = Buffer.from([255, 0, 0, 255, 0, 255, 0, 128, 0, 0, 255, 0, 9, 9, 9, 255]);
    const decoded = decodePng(encodePng(2, 2, rgba));
    expect(decoded.width).toBe(2);
    expect(decoded.height).toBe(2);
    expect(Buffer.from(decoded.pixels).equals(rgba)).toBe(true);
  });

  it('unfilters Sub, Up, Average and Paeth scanlines', () => {
    const raw = Buffer.from([
      1, 10, 20, 30, 40, 10, 20, 30, 40, // Sub
      2, 5, 5, 5, 5, 5, 5, 5, 5, // Up
      3, 10, 10, 10, 10, 10, 10, 10, 10, // Average
      4, 1, 1, 1, 1, 1, 1, 1, 1, // Paeth
    ]);
    const ihdr = Buffer.alloc(13);
    ihdr.writeUInt32BE(2, 0);
    ihdr.writeUInt32BE(4, 4);
    ihdr[8] = 8; // bit depth
    ihdr[9] = 6; // RGBA
    const png = Buffer.concat([
      Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
      chunk('IHDR', ihdr),
      chunk('IDAT', deflateSync(raw)),
      chunk('IEND', Buffer.alloc(0)),
    ]);
    const decoded = decodePng(png);
    expect([...decoded.pixels]).toEqual([
      10, 20, 30, 40, 20, 40, 60, 80,
      15, 25, 35, 45, 25, 45, 65, 85,
      17, 22, 27, 32, 31, 43, 56, 68,
      18, 23, 28, 33, 32, 44, 57, 69,
    ]);
  });
});

describe('convertPngToSprite', () => {
  it('round-trips a grid exactly when matched against its own palette', () => {
    const sprite = convertPngToSprite(gridToPng(TALL_GRASS, PALETTE), { palette: PALETTE });
    expect(sprite.frames).toEqual([TALL_GRASS]);
    expect(sprite.palette).toEqual(PALETTE);
  });

  it('derives a palette with keys assigned most-used-first', () => {
    const sprite = convertPngToSprite(gridToPng(TALL_GRASS, PALETTE), {});
    // 'g' is the most frequent color, so it gets the first key 'a'.
    expect(sprite.palette.a).toBe(PALETTE.g);
    // Re-parsing the emitted grid must reproduce the identical pixels.
    const original = parseGrid(TALL_GRASS, PALETTE);
    const emitted = parseGrid(sprite.frames[0], sprite.palette);
    expect(Buffer.from(emitted.pixels).equals(Buffer.from(original.pixels))).toBe(true);
  });

  it('splits a horizontal strip into frames', () => {
    const frameB = TALL_GRASS.map((row) => row.split('').reverse().join(''));
    const sprite = convertPngToSprite(stripToPng([TALL_GRASS, frameB], PALETTE), {
      frames: 2,
      palette: PALETTE,
    });
    expect(sprite.frames).toEqual([TALL_GRASS, frameB]);
  });

  it('rejects off-palette pixels with the exact coordinate and color', () => {
    const png = gridToPng(TALL_GRASS, { ...PALETTE, t: '#b1d67f' });
    expect(() => convertPngToSprite(png, { palette: PALETTE })).toThrow(/\(2, 0\).*#b1d67f/);
  });

  it('accepts slightly-off colors within --tolerance', () => {
    const png = gridToPng(TALL_GRASS, { ...PALETTE, t: '#b1d67f' });
    const sprite = convertPngToSprite(png, { palette: PALETTE, tolerance: 2 });
    expect(sprite.frames).toEqual([TALL_GRASS]);
  });

  it('snaps any color to the closest palette entry with forceNearest', () => {
    const png = gridToPng(TALL_GRASS, { ...PALETTE, t: '#c0e080' });
    const sprite = convertPngToSprite(png, { palette: PALETTE, forceNearest: true });
    expect(sprite.frames).toEqual([TALL_GRASS]);
  });

  it('formats the sprite as paste-ready source code', () => {
    const sprite = convertPngToSprite(gridToPng(TALL_GRASS, PALETTE), { palette: PALETTE });
    const code = sprite.toCode('TALL_GRASS');
    expect(code).toContain('const TALL_GRASS_FRAMES: TextureGrid[]');
    expect(code).toContain("'..t........t....',");
    expect(code).toContain("t: '#b1d67e',");
  });
});
