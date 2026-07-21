import { Palette, SpriteDefinition } from '../grid';
import { SAND_GRID } from './tiles';

/**
 * Depth-tinted soil. The ground keeps one shape (SAND_GRID) but its palette is
 * blended by depth: rich brown topsoil near the surface, greying through the
 * middle, into near-black at the bottom. Grass caps the exposed valley floor.
 * Blending is pure so it can be unit-tested; the registry bakes a set of bands.
 */

type Roles = 'a' | 'l' | 'd' | 'e';
type SoilAnchor = Record<Roles, string>;

/** a = base, l = light grains, d = dark speckle, e = deep shadow. */
const TOPSOIL: SoilAnchor = { a: '#8a5a2e', l: '#a9743e', d: '#5f3a1e', e: '#472a14' };
const MIDSOIL: SoilAnchor = { a: '#6d6156', l: '#8b7f72', d: '#4b433b', e: '#38312a' };
const DEEPSOIL: SoilAnchor = { a: '#33313a', l: '#46454f', d: '#242229', e: '#17161b' };

/** How many baked depth bands the registry pre-renders. */
export const SOIL_BANDS = 12;

const ROLES: readonly Roles[] = ['a', 'l', 'd', 'e'];

/** Soil palette at depth fraction t in [0,1] (0 = topsoil, 1 = deepest). */
export function soilPalette(t: number): Palette {
  const clamped = Math.max(0, Math.min(1, t));
  const palette: Record<string, string> = {};
  for (const role of ROLES) {
    palette[role] =
      clamped < 0.5
        ? blend(TOPSOIL[role], MIDSOIL[role], clamped * 2)
        : blend(MIDSOIL[role], DEEPSOIL[role], (clamped - 0.5) * 2);
  }
  return palette;
}

/** Which baked band index a depth fraction maps to. */
export function soilBandIndex(t: number, bands = SOIL_BANDS): number {
  const clamped = Math.max(0, Math.min(1, t));
  return Math.round(clamped * (bands - 1));
}

/** Grass-capped topsoil for the exposed surface row. */
export const GRASS_SPRITE: SpriteDefinition = {
  frames: [
    [
      'gtggtggtgtggtgtg',
      'gggggggggggggggg',
      'rgrrgrgrrgrgrgrg',
      ...SAND_GRID.slice(3),
    ],
  ],
  palette: { g: '#6fae52', t: '#b1d67e', r: '#4a7a34', ...soilPalette(0) },
};

function blend(from: string, to: string, t: number): string {
  const a = hexToRgb(from);
  const b = hexToRgb(to);
  const mix = (i: number) => Math.round(a[i] + (b[i] - a[i]) * t);
  return `#${[mix(0), mix(1), mix(2)].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function hexToRgb(hex: string): [number, number, number] {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
