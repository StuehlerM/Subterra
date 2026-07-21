import { describe, expect, it } from 'vitest';
import { parseGrid } from '../../src/infra/sprites/grid';
import { GRASS_SPRITE, SOIL_BANDS, soilBandIndex, soilPalette } from '../../src/infra/sprites/art/soil';

describe('soilPalette', () => {
  it('is rich brown at the top and near-black at the bottom', () => {
    expect(soilPalette(0).a).toBe('#8a5a2e'); // topsoil
    expect(soilPalette(1).a).toBe('#33313a'); // deepest
  });

  it('greys through the middle (between the two anchors)', () => {
    expect(soilPalette(0.5).a).toBe('#6d6156');
  });

  it('clamps out-of-range depths', () => {
    expect(soilPalette(-2).a).toBe(soilPalette(0).a);
    expect(soilPalette(5).a).toBe(soilPalette(1).a);
  });

  it('produces valid #rrggbb for every role at any depth', () => {
    for (const t of [0, 0.25, 0.5, 0.75, 1]) {
      const palette = soilPalette(t);
      for (const role of ['a', 'l', 'd', 'e']) {
        expect(palette[role]).toMatch(/^#[0-9a-f]{6}$/);
      }
    }
  });
});

describe('soilBandIndex', () => {
  it('maps depth fractions across the band range', () => {
    expect(soilBandIndex(0)).toBe(0);
    expect(soilBandIndex(1)).toBe(SOIL_BANDS - 1);
    expect(soilBandIndex(0.5)).toBe(Math.round(0.5 * (SOIL_BANDS - 1)));
  });
});

describe('grass sprite', () => {
  it('parses as a 16x16 tile', () => {
    const parsed = parseGrid(GRASS_SPRITE.frames[0], GRASS_SPRITE.palette);
    expect(parsed.width).toBe(16);
    expect(parsed.height).toBe(16);
  });
});
