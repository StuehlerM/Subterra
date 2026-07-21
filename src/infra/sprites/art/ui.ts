import { Palette, SpriteDefinition, TextureGrid } from '../grid';
import { ENTITY_SPRITES } from './entities';

/**
 * UI art as text grids: a tiny digit font, 16x16 icons, one 24x24 nine-slice
 * panel shape (wood and stone are the same grid through different palettes)
 * and the 32x32 title gem. Everything here rides in the JS bundle like the
 * rest of the art — the UI ships zero image files too.
 */

// ------------------------------------------------------------- digit font

export const FONT_PALETTE: Palette = { x: '#fff3d6' };

/**
 * 3x5 glyphs: digits, uppercase letters and a little punctuation. Space is
 * not a glyph — the painter just advances the cursor. ('O' intentionally
 * shares the '0' shape; at 3x5 there is only one honest way to draw it.)
 */
export const PIXEL_FONT: Record<string, TextureGrid> = {
  '0': ['xxx', 'x.x', 'x.x', 'x.x', 'xxx'],
  '1': ['.x.', 'xx.', '.x.', '.x.', 'xxx'],
  '2': ['xxx', '..x', 'xxx', 'x..', 'xxx'],
  '3': ['xxx', '..x', '.xx', '..x', 'xxx'],
  '4': ['x.x', 'x.x', 'xxx', '..x', '..x'],
  '5': ['xxx', 'x..', 'xxx', '..x', 'xxx'],
  '6': ['xxx', 'x..', 'xxx', 'x.x', 'xxx'],
  '7': ['xxx', '..x', '.x.', '.x.', '.x.'],
  '8': ['xxx', 'x.x', 'xxx', 'x.x', 'xxx'],
  '9': ['xxx', 'x.x', 'xxx', '..x', 'xxx'],
  '/': ['..x', '..x', '.x.', 'x..', 'x..'],
  A: ['xxx', 'x.x', 'xxx', 'x.x', 'x.x'],
  B: ['xx.', 'x.x', 'xx.', 'x.x', 'xx.'],
  C: ['xxx', 'x..', 'x..', 'x..', 'xxx'],
  D: ['xx.', 'x.x', 'x.x', 'x.x', 'xx.'],
  E: ['xxx', 'x..', 'xx.', 'x..', 'xxx'],
  F: ['xxx', 'x..', 'xx.', 'x..', 'x..'],
  G: ['xxx', 'x..', 'x.x', 'x.x', 'xxx'],
  H: ['x.x', 'x.x', 'xxx', 'x.x', 'x.x'],
  I: ['xxx', '.x.', '.x.', '.x.', 'xxx'],
  J: ['..x', '..x', '..x', 'x.x', 'xxx'],
  K: ['x.x', 'x.x', 'xx.', 'x.x', 'x.x'],
  L: ['x..', 'x..', 'x..', 'x..', 'xxx'],
  M: ['x.x', 'xxx', 'xxx', 'x.x', 'x.x'],
  N: ['xxx', 'x.x', 'x.x', 'x.x', 'x.x'],
  O: ['xxx', 'x.x', 'x.x', 'x.x', 'xxx'],
  P: ['xxx', 'x.x', 'xxx', 'x..', 'x..'],
  Q: ['xxx', 'x.x', 'x.x', 'xxx', '..x'],
  R: ['xxx', 'x.x', 'xx.', 'x.x', 'x.x'],
  S: ['.xx', 'x..', '.x.', '..x', 'xx.'],
  T: ['xxx', '.x.', '.x.', '.x.', '.x.'],
  U: ['x.x', 'x.x', 'x.x', 'x.x', 'xxx'],
  V: ['x.x', 'x.x', 'x.x', 'x.x', '.x.'],
  W: ['x.x', 'x.x', 'xxx', 'xxx', 'x.x'],
  X: ['x.x', 'x.x', '.x.', 'x.x', 'x.x'],
  Y: ['x.x', 'x.x', '.x.', '.x.', '.x.'],
  Z: ['xxx', '..x', '.x.', 'x..', 'xxx'],
  '!': ['.x.', '.x.', '.x.', '...', '.x.'],
  '?': ['xxx', '..x', '.xx', '...', '.x.'],
  "'": ['.x.', '.x.', '...', '...', '...'],
};

// ------------------------------------------------------------------ panels

/** Art pixels from each panel edge that must never stretch (nine-slice). */
export const PANEL_CORNER = 2;

const PANEL_SHAPE: TextureGrid = (() => {
  const top = 'o'.repeat(24);
  const lightRow = `o${'l'.repeat(22)}o`;
  const bodyRow = `ol${'w'.repeat(20)}do`;
  const darkRow = `o${'d'.repeat(22)}o`;
  return [top, lightRow, ...Array.from({ length: 20 }, () => bodyRow), darkRow, top];
})();

export const PANELS: Record<'wood' | 'stone', SpriteDefinition> = {
  wood: {
    frames: [PANEL_SHAPE],
    palette: { o: '#3a2416', l: '#b8804a', w: '#8a5a30', d: '#5c3a1e' },
  },
  stone: {
    frames: [PANEL_SHAPE],
    palette: { o: '#1c1f26', l: '#6a7280', w: '#4a5160', d: '#333845' },
  },
};

// ------------------------------------------------------------------- icons

const COIN: SpriteDefinition = {
  frames: [
    [
      '................',
      '................',
      '.....oooooo.....',
      '....oggggggo....',
      '...ogglgggggo...',
      '..ogglgggggddo..',
      '..oglgggggggdo..',
      '..oglgggggggdo..',
      '..oglgggggggdo..',
      '..ogggggggggdo..',
      '..oggggggggddo..',
      '...ogggggggdo...',
      '....oggggddo....',
      '.....oooooo.....',
      '................',
      '................',
    ],
  ],
  palette: { o: '#8a5a1a', g: '#ffcf3f', l: '#ffe58a', d: '#cc9c1f' },
};

const CRATE: SpriteDefinition = {
  frames: [
    [
      '................',
      '................',
      '.oooooooooooooo.',
      '.olllllllllllwo.',
      '.olwwwwwwwwwwdo.',
      '.olwwwwwwwwwwdo.',
      '.oddddddddddddo.',
      '.olwwwwwwwwwwdo.',
      '.olwwwwwwwwwwdo.',
      '.oddddddddddddo.',
      '.olwwwwwwwwwwdo.',
      '.olwwwwwwwwwwdo.',
      '.oddddddddddddo.',
      '.oooooooooooooo.',
      '................',
      '................',
    ],
  ],
  palette: { o: '#3a2416', l: '#b8804a', w: '#8a5a30', d: '#5c3a1e' },
};

/**
 * Battery shell with a hollow inside: the HUD paints the charge as a coloured
 * fill *behind* this icon, showing through the transparent interior.
 */
const BATTERY: SpriteDefinition = {
  frames: [
    [
      '................',
      '................',
      '................',
      '................',
      '.oooooooooooo...',
      '.o..........o...',
      '.o..........ott.',
      '.o..........ott.',
      '.o..........ott.',
      '.o..........ott.',
      '.o..........o...',
      '.oooooooooooo...',
      '................',
      '................',
      '................',
      '................',
    ],
  ],
  palette: { o: '#23262e', t: '#aeb6bf' },
};

/** Where the charge fill goes, in icon art pixels. */
export const BATTERY_INTERIOR = { x: 2, y: 5, w: 10, h: 6 };

const DEPTH: SpriteDefinition = {
  frames: [
    [
      '................',
      '................',
      '................',
      '......aaaa......',
      '......aaaa......',
      '......aaaa......',
      '......aaaa......',
      '......aaaa......',
      '......aaaa......',
      '..aaaaaaaaaaaa..',
      '...aaaaaaaaaa...',
      '....aaaaaaaa....',
      '.....aaaaaa.....',
      '......aaaa......',
      '.......aa.......',
      '................',
    ],
  ],
  palette: { a: '#9fd0ff' },
};

const PICKAXE: SpriteDefinition = {
  frames: [
    [
      '................',
      '................',
      '....mmmmmmmm....',
      '..mm...mm...mm..',
      '.mm....hh....mm.',
      '.m.....hh.....m.',
      '.......hh.......',
      '.......hh.......',
      '.......hh.......',
      '.......hh.......',
      '.......hh.......',
      '.......hh.......',
      '.......hh.......',
      '.......hh.......',
      '................',
      '................',
    ],
  ],
  palette: { m: '#aeb6bf', h: '#8a5a30' },
};

const LIGHTNING: SpriteDefinition = {
  frames: [
    [
      '................',
      '................',
      '.......yyyy.....',
      '......yyyy......',
      '.....yyyy.......',
      '....yyyyyyy.....',
      '......yyyy......',
      '.....yyyy.......',
      '....yyyy........',
      '...yyyy.........',
      '..yyy...........',
      '..yy............',
      '..y.............',
      '................',
      '................',
      '................',
    ],
  ],
  palette: { y: '#ffe36e' },
};

const BLAST: SpriteDefinition = {
  frames: [
    [
      '................',
      '................',
      '................',
      '.......g........',
      '...g...g...g....',
      '....g..g..g.....',
      '.....ggggg......',
      '...ggwwwwwgg....',
      'gggggwwwwwggggg.',
      '...ggwwwwwgg....',
      '.....ggggg......',
      '....g..g..g.....',
      '...g...g...g....',
      '.......g........',
      '................',
      '................',
    ],
  ],
  palette: { g: '#ffa53c', w: '#fff7d1' },
};

const STAR: SpriteDefinition = {
  frames: [
    [
      '................',
      '................',
      '................',
      '.......yy.......',
      '.......yy.......',
      '......yyyy......',
      '..yyyyyyyyyyyy..',
      '...yyyyyyyyyy...',
      '....yyyyyyyy....',
      '....yyyyyyyy....',
      '...yyy....yyy...',
      '..yy........yy..',
      '................',
      '................',
      '................',
      '................',
    ],
  ],
  palette: { y: '#ffe36e' },
};

const X_KEY: SpriteDefinition = {
  frames: [
    [
      '................',
      '................',
      '..oooooooooooo..',
      '.occcccccccccco.',
      '.occcccccccccco.',
      '.occcxccccxccco.',
      '.occccxccxcccco.',
      '.occcccxxccccco.',
      '.occcccxxccccco.',
      '.occccxccxcccco.',
      '.occcxccccxccco.',
      '.occcccccccccco.',
      '..oooooooooooo..',
      '................',
      '................',
      '................',
    ],
  ],
  palette: { o: '#2b2b35', c: '#e8e0d0', x: '#2b2b35' },
};

const PAUSE: SpriteDefinition = {
  frames: [
    [
      '................',
      '................',
      '................',
      '...bbb....bbb...',
      '...bbb....bbb...',
      '...bbb....bbb...',
      '...bbb....bbb...',
      '...bbb....bbb...',
      '...bbb....bbb...',
      '...bbb....bbb...',
      '...bbb....bbb...',
      '...bbb....bbb...',
      '...bbb....bbb...',
      '................',
      '................',
      '................',
    ],
  ],
  palette: { b: '#fff3d6' },
};

const PLUS: SpriteDefinition = {
  frames: [
    [
      '................',
      '................',
      '................',
      '................',
      '......pppp......',
      '......pppp......',
      '......pppp......',
      '..pppppppppppp..',
      '..pppppppppppp..',
      '......pppp......',
      '......pppp......',
      '......pppp......',
      '................',
      '................',
      '................',
      '................',
    ],
  ],
  palette: { p: '#57c04a' },
};

const DRILL_DOWN: SpriteDefinition = {
  frames: [
    [
      '................',
      '..mmmmmmm.......',
      '.mm..hh..mm.....',
      '.....hh.........',
      '.....hh.........',
      '.....hh.........',
      '.....hh.........',
      '................',
      '..........aa....',
      '..........aa....',
      '.......aaaaaaaa.',
      '........aaaaaa..',
      '.........aaaa...',
      '..........aa....',
      '................',
      '................',
    ],
  ],
  palette: { m: '#aeb6bf', h: '#8a5a30', a: '#9fd0ff' },
};

const WARNING: SpriteDefinition = {
  frames: [
    [
      '................',
      '................',
      '.......tt.......',
      '......tttt......',
      '......tttt......',
      '.....ttkktt.....',
      '.....ttkktt.....',
      '....tttkkttt....',
      '....tttkkttt....',
      '...tttttttttt...',
      '...ttttkktttt...',
      '..tttttkkttttt..',
      '..tttttttttttt..',
      '.tttttttttttttt.',
      '................',
      '................',
    ],
  ],
  palette: { t: '#ffcf3f', k: '#2b2b35' },
};

export const UI_ICONS: Record<string, SpriteDefinition> = {
  coin: COIN,
  crate: CRATE,
  battery: BATTERY,
  dynamite: { frames: [ENTITY_SPRITES.dynamite.frames[0]], palette: ENTITY_SPRITES.dynamite.palette },
  flare: { frames: [ENTITY_SPRITES.flare.frames[0]], palette: ENTITY_SPRITES.flare.palette },
  depth: DEPTH,
  pickaxe: PICKAXE,
  lightning: LIGHTNING,
  blast: BLAST,
  star: STAR,
  x_key: X_KEY,
  pause: PAUSE,
  plus: PLUS,
  drill_down: DRILL_DOWN,
  warning: WARNING,
};

// ------------------------------------------------------------------ emblem

/** 32x32 faceted gem for the title screen. */
export const EMBLEM: SpriteDefinition = {
  frames: [
    [
      '................................',
      '................................',
      '................................',
      '................................',
      '...............oo...............',
      '..............ollo..............',
      '.............ollllo.............',
      '............ogllllgo............',
      '...........oggllllggo...........',
      '..........ogggllllgggo..........',
      '.........oggggllllggggo.........',
      '........ogggggllllgggggo........',
      '.......oggggggllllggggggo.......',
      '......ogggggggllllgggggggo......',
      '.....oggggggggllllggggggggo.....',
      '....ollllllllllllllllllllllo....',
      '....oggggggggggggggggggggggo....',
      '.....ogggggggggddgggggggggo.....',
      '......oggggggggddggggggggo......',
      '.......ogggggggddgggggggo.......',
      '........oggggggddggggggo........',
      '.........ogggggddgggggo.........',
      '..........oggggddggggo..........',
      '...........ogggddgggo...........',
      '............oggddggo............',
      '.............ogddgo.............',
      '..............oddo..............',
      '...............oo...............',
      '................................',
      '................................',
      '................................',
      '................................',
    ],
  ],
  palette: { o: '#17414b', g: '#4fd0e3', l: '#90e9f7', d: '#2a9db3' },
};
