import { TileType } from '../../../domain/world/tiles';
import { SpriteDefinition, TextureGrid } from '../grid';

/**
 * Tile art as text grids (16x16). Each character is one pixel; '.' is
 * transparent. All six ores share ONE vein shape and differ only by palette,
 * so a new ore costs three hex values.
 */

/** Shared soil/ground shape; the renderer tints it by depth (see art/soil.ts). */
export const SAND_GRID: TextureGrid = [
  'aaaalaadaaaaalaa',
  'adaaaaaaalaaaaaa',
  'aaaaadaaaaaaalad',
  'laaaaaaadaaaaaaa',
  'aaaalaaaaadalaaa',
  'aeaaaaaaaaaaaala',
  'aaaaaadlaaaaaaaa',
  'alaaaaaaaadaaaaa',
  'daaaalaaaaaaaald',
  'aaaaaaaadaaalaaa',
  'alaadaaaaaeaaaaa',
  'aaaaaalaaaaaaada',
  'adaaaaaaaadaaaaa',
  'aaaalaaaaaaaaala',
  'aadaaaaaladaaaaa',
  'laaaaadaaaaaaaea',
];

const SAND_PALETTE = {
  a: '#c2a15a', // base sand
  l: '#d4b878', // light grains
  d: '#a8853f', // dark speckles
  e: '#8f6f33', // deep shadow spots
};

/**
 * Bedrock: dense, dark diagonal strata with hard crack lines, sharp ridges and
 * a few crystalline glints — obviously solid/unbreakable, and clearly not the
 * smooth rounded boulder that can fall. Tiles cleanly (4px diagonal period).
 */
const BEDROCK: TextureGrid = [
  'dhbmdhbmdhbmdhbm',
  'hbmdhbmdhbmdhbmd',
  'bmdhbgdhbmdhbmdh',
  'mdhbmdhbmdhbmdhb',
  'dhbmdhbmdhbmdhbm',
  'hbmdhbmdhbmdgbmd',
  'bmdhbmdhbmdhbmdh',
  'mdhbmdhbmdhbmdhb',
  'dhbmdhbmdhbmdhbm',
  'hbgdhbmdhbmdhbmd',
  'bmdhbmdhbmdhbmdh',
  'mdhbmdhbmdhbmdhb',
  'dhbmdhbmdhbmdhbm',
  'hbmdhbmdhgmdhbmd',
  'bmdhbmdhbmdhbmdh',
  'mdhbmdhbmdhbmdhb',
];

const BEDROCK_PALETTE = {
  d: '#171a20', // dark crack line
  b: '#2b303a', // base stone
  m: '#363c48', // mid facet
  h: '#4a5264', // ridge highlight
  g: '#7e879a', // crystalline glint
};

const ROCK: TextureGrid = [
  '....oooooooo....',
  '..oohhhhrrrroo..',
  '.ohhhhrrrrrrrdo.',
  '.ohhrrrrrrrrrdo.',
  'ohhrrrrrrrrrrddo',
  'ohrrrrrhhrrrrddo',
  'orrrrrhhrrrrrddo',
  'orrrrrrrrrrrdddo',
  'orrrdrrrrrrddddo',
  'orrddrrrrrdddddo',
  'orrrdrrrrrdddddo',
  '.orrrrrrrdddddo.',
  '.orrrrrrdddddo..',
  '.orrrddddddddo..',
  '..ooddddddddoo..',
  '....oooooooo....',
];

const ROCK_PALETTE = {
  o: '#464c55', // outline
  r: '#808791', // boulder
  h: '#9aa1ab', // top light
  d: '#5d646e', // bottom shade
};

/**
 * Vein shapes shared by every ore; palettes make them coal/copper/...
 * Several variants exist so an ore field doesn't look stamped — the renderer
 * picks one per tile with a position hash.
 */
const ORE_VEIN_VARIANTS: TextureGrid[] = [
  [
    'aaaaabaaaaaaaaaa',
    'aavvaaaaaabaaaaa',
    'avwvvaaaaaaavvaa',
    'avvuvaaabaavwvva',
    'aavvaaaaaaavvuva',
    'aaaabaaaaaaavvaa',
    'abaaaaavaaaaabaa',
    'aaaaaavwvaaaaaaa',
    'aaaavvvuvvaabaaa',
    'aabavwvvvuaaaaaa',
    'aaaavuvavaaaaaba',
    'abaaaavaaaavaaaa',
    'aaaaabaaaavwvaba',
    'aavaaaaaaavvuvaa',
    'avwvaabaaaavvaaa',
    'aavaaaaaaabaaaaa',
  ],
  [
    'aabaaaaaavaaaaaa',
    'aaaaavaaavwvaaba',
    'aaaavwvaavvaaaaa',
    'abaavvuvaaaaabaa',
    'aaaaavvaaaaaaaaa',
    'aaaaaaaaabaavvaa',
    'aavaaaaaaaavwvva',
    'avwvaaabaaavvuva',
    'avuvvaaaaaaavvaa',
    'aavvaabaaaaaaaba',
    'aaaaaaaaavaaaaaa',
    'abaaaaaavwvaabaa',
    'aaaavaavvuvaaaaa',
    'aaavwvaavvaaaaba',
    'aaavvaaaaabaaaaa',
    'abaaaaaaaaaaavaa',
  ],
  [
    'aaaaaaavaaaabaaa',
    'aabaaavwvaaaaaaa',
    'aaaaavvuvaaavaaa',
    'aaaaaavvaaavwvaa',
    'abaaaaaaaaavvuva',
    'aaaaabaaaaaavvaa',
    'aavvaaaaaaaaaaba',
    'avwvvaaabaaaaaaa',
    'avvuvaaaaaavaaaa',
    'aavvaaaaaavwvaba',
    'aaaaaaaaaavvuvaa',
    'aabaavaaaavvaaaa',
    'aaaaavwvaaaaaaba',
    'abaaavvuvaaaaaaa',
    'aaaaaavvaaabaava',
    'aaabaaaaaaaaaaaa',
  ],
];

/**
 * Cool stone-grey host rock the veins sit in (shared by all ores). Kept darker
 * than iron's (#a7a19a) and silver's (#d7dce0) vein tones so those grey ores
 * still read clearly against it.
 */
const ORE_GROUND = {
  a: '#6f747b',
  b: '#595e64',
};

function ore(vein: string, highlight: string, shadow: string): SpriteDefinition {
  return {
    frames: ORE_VEIN_VARIANTS,
    palette: { ...ORE_GROUND, v: vein, w: highlight, u: shadow },
  };
}

export const TILE_SPRITES: Partial<Record<TileType, SpriteDefinition>> = {
  [TileType.Sand]: { frames: [SAND_GRID], palette: SAND_PALETTE },
  [TileType.Bedrock]: { frames: [BEDROCK], palette: BEDROCK_PALETTE },
  [TileType.Rock]: { frames: [ROCK], palette: ROCK_PALETTE },
  [TileType.Coal]: ore('#33343a', '#4d4f57', '#1f2024'),
  [TileType.Copper]: ore('#b87333', '#d98e4a', '#8a5426'),
  [TileType.Iron]: ore('#a7a19a', '#c6c0b8', '#7d7871'),
  [TileType.Silver]: ore('#d7dce0', '#f2f6f9', '#a9b1b9'),
  [TileType.Gold]: ore('#ffcf3f', '#ffe58a', '#cc9c1f'),
  [TileType.Gem]: ore('#4fd0e3', '#90e9f7', '#2a9db3'),
};
