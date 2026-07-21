import { describe, expect, it } from 'vitest';
import { parseGrid } from '../../src/infra/sprites/grid';

const PALETTE = {
  r: '#ff0000',
  g: '#00ff00',
  b: '#0000ff',
};

/** RGBA of pixel (x, y) in a parsed sprite. */
function pixelAt(pixels: Uint8ClampedArray, width: number, x: number, y: number): number[] {
  const i = (y * width + x) * 4;
  return [pixels[i], pixels[i + 1], pixels[i + 2], pixels[i + 3]];
}

describe('parseGrid', () => {
  it('maps palette characters to opaque RGBA pixels', () => {
    const sprite = parseGrid(['rg', 'br'], PALETTE);
    expect(sprite.width).toBe(2);
    expect(sprite.height).toBe(2);
    expect(pixelAt(sprite.pixels, 2, 0, 0)).toEqual([255, 0, 0, 255]);
    expect(pixelAt(sprite.pixels, 2, 1, 0)).toEqual([0, 255, 0, 255]);
    expect(pixelAt(sprite.pixels, 2, 0, 1)).toEqual([0, 0, 255, 255]);
    expect(pixelAt(sprite.pixels, 2, 1, 1)).toEqual([255, 0, 0, 255]);
  });

  it('treats dots as fully transparent pixels', () => {
    const sprite = parseGrid(['.r', 'r.'], PALETTE);
    expect(pixelAt(sprite.pixels, 2, 0, 0)).toEqual([0, 0, 0, 0]);
    expect(pixelAt(sprite.pixels, 2, 1, 1)).toEqual([0, 0, 0, 0]);
  });

  it('parses lowercase and uppercase hex colors', () => {
    const sprite = parseGrid(['x'], { x: '#AbCdEf' });
    expect(pixelAt(sprite.pixels, 1, 0, 0)).toEqual([0xab, 0xcd, 0xef, 255]);
  });

  it('reuses one palette across different grids', () => {
    const a = parseGrid(['r'], PALETTE);
    const b = parseGrid(['g'], PALETTE);
    expect(pixelAt(a.pixels, 1, 0, 0)).toEqual([255, 0, 0, 255]);
    expect(pixelAt(b.pixels, 1, 0, 0)).toEqual([0, 255, 0, 255]);
  });

  it('rejects an empty grid', () => {
    expect(() => parseGrid([], PALETTE)).toThrow(/empty/i);
  });

  it('rejects ragged rows and names the offending row', () => {
    expect(() => parseGrid(['rr', 'r'], PALETTE)).toThrow(/row 1/);
  });

  it('rejects unknown characters with their coordinate', () => {
    expect(() => parseGrid(['r?'], PALETTE)).toThrow(/'\?'.*\(1, 0\)/);
  });

  it('rejects malformed palette colors', () => {
    expect(() => parseGrid(['x'], { x: 'red' })).toThrow(/'x'.*red/);
  });
});
