import { SpriteDefinition, TextureGrid } from '../grid';

/**
 * Backdrop art. The sky is a 1-pixel-wide vertical color ramp the renderer
 * stretches across the screen; the cave is a 32x32 tileable speckle pattern.
 */

const SKY_RAMP: TextureGrid = [
  'a',
  'a',
  'b',
  'b',
  'c',
  'c',
  'd',
  'd',
  'e',
  'e',
  'f',
  'f',
  'g',
  'g',
  'h',
  'h',
];

const SKY_PALETTE = {
  a: '#3f7cc0', // zenith
  b: '#4f8cc9',
  c: '#629cd3',
  d: '#78aedd',
  e: '#90c1e7',
  f: '#a9d3ee',
  g: '#bfe2f3',
  h: '#cfeaf6', // horizon haze
};

const CAVE_SPECKLE: TextureGrid = [
  'nnntnnnnnnnnnnnnnnnnnnsnnnnnnnnn',
  'nnnnnnnnnnnnnmnnnnnnnnnnntnnnnnn',
  'nnnnnnsnnnnnnnnnnnntnnnnnnnnnnnn',
  'nnnnnnnnntnnnnnnnnnnnnnnnnnnnmnn',
  'nnnntnnnnnnnnnnnnnnnnnnnnnnnnnsn',
  'nnnnnnnnnnntnnnnnnmnnnnnnnnnnnnn',
  'nnnnnnnnnnnnnnnnntnnnnnnnnnnnnnn',
  'nsnnnnnnnnnnnnnnnnnnnnnnnnntnnnn',
  'nnnnnnnnnnnnnnsnnnnnnnnnnnnnnnnn',
  'ntnnnnnnnnnnnnnnnnnnnmnnnnnnnnnn',
  'nnnnnnnnnnntnnnnnnnnnnnnnnnnnnsn',
  'nnnnnmnnnnnnnnnnnnnnnnnnntnnnnnn',
  'nnnnnnnnnnnnnnnnnnntnnnnnnnnnnnn',
  'nnnnnnsnnnnnnnnnnnnnnnnnnnmnnnnn',
  'nnnnnnnnnnnntnnnnnnnnnnnnnnnnnnn',
  'nnntnnnnnnnnnnnnntnnnnnnnnnnnnnn',
  'nnnnnnnnnnnnnnsnnnnnnnnnnnnnnmnn',
  'ntnnnnnnnnnnnnnnnnnnnnnnnnntnnnn',
  'nnnnnnnnnnmnnnnnnnnnnnsnnnnnnnnn',
  'nnnnnnnnnnnnnnnnnnnnnnnnntnnnnnn',
  'nnnnnmnnnnntnnnnnnnnnnnnnnnnnnnn',
  'nnnnnnnnnnnnnnnnnnnnnnsnnnnnnnnn',
  'nnnntnnnnnnnnnnnnnnnnnnnnnntnnnn',
  'nnnnnnnnntnnnnnnnnnnnnnnnnnnnnnn',
  'nnnnnnnnnnnnnnnnnnnnnmnnnnnnnnsn',
  'nnntnnnnnnnnnnnnnnnnnnnnnnnnnnnn',
  'nnnnnnnnnnnnnnsnntnnnnnnnnnnnnnn',
  'nnmnnnnnnnnnnnnnnnnnnnnnnnnnnmnn',
  'nnnnnnnnnnntnnnnnnnnnnnnnnnnnnnn',
  'nnnnnnnnnnnnnnnnnnnntnnnnnnnnnsn',
  'ntnnnnnnnnnnnnnnnnnnnnnnnnnnnnnn',
  'nnnnnnnnnnnnnmnnnnntnnnnnnnnnnnn',
];

const CAVE_PALETTE = {
  n: '#0b1d26', // deep rock
  t: '#123138', // lighter patch
  m: '#071219', // darker pit
  s: '#16404a', // faint glint
};

export const BACKGROUND_SPRITES: Record<string, SpriteDefinition> = {
  sky: { frames: [SKY_RAMP], palette: SKY_PALETTE },
  cave: { frames: [CAVE_SPECKLE], palette: CAVE_PALETTE },
};
