import { SpriteDefinition, TextureGrid } from '../grid';

/**
 * Entity art as text grids (16x16, '.' = transparent). Animated sprites list
 * several frames; the renderer flips between them by frame index.
 */

const PLAYER_BODY: TextureGrid = [
  '......oooo......',
  '.....oyyyyo.....',
  '....oyyyyyyo....',
  '....oyylyyyo....',
  '....oYYYYYYo....',
  '....offffffo....',
  '....ofoffofo....',
  '....offffffo....',
  '.....offffo.....',
  '...occccccco....',
  '...occCcCcco....',
  '..ofcccccccfo...',
  '..ofcCcccCcfo...',
  '...oCCCCCCCo....',
];

const PLAYER_FRAMES: TextureGrid[] = [
  [...PLAYER_BODY, '...occo.occo....', '...okko.okko....'],
  [...PLAYER_BODY, '..occo...occo...', '..okko...okko...'],
];

const PLAYER_PALETTE = {
  o: '#2b2b35', // outline + eyes
  y: '#ffd34d', // helmet
  Y: '#d9a92e', // helmet brim
  l: '#fff7d1', // headlamp
  f: '#f2c9a0', // skin
  c: '#3f6fb0', // overalls
  C: '#2d5288', // overall shade / belt
  k: '#5a3d28', // boots
};

const BAT_WINGS_UP: TextureGrid = [
  '................',
  '................',
  '................',
  '..o..........o..',
  '.owo........owo.',
  '.owwoop..poowwo.',
  '.owwooppppoowwo.',
  '..owopeppepowo..',
  '..owoppppppowo..',
  '....ootpptoo....',
  '......oppo......',
  '.......oo.......',
  '................',
  '................',
  '................',
  '................',
];

const BAT_WINGS_DOWN: TextureGrid = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '.....op..po.....',
  'oo...oppppo...oo',
  'owo.opeppepo.owo',
  'owwooppppppoowwo',
  '.owwootpptoowwo.',
  '..owo.oppo.owo..',
  '...o...oo...o...',
  '................',
  '................',
  '................',
  '................',
];

const BAT_PALETTE = {
  o: '#241a38', // outline
  p: '#6b4fa3', // fur
  w: '#4a3380', // wing membrane
  e: '#ff4a4a', // eyes
  t: '#ffffff', // fangs
};

const BAT_ASLEEP_HANGING: TextureGrid = [
  '................',
  '......o..o......',
  '......oppo......',
  '.....owwppo.....',
  '....owwwwppo....',
  '....owwwwwpo....',
  '....owwwwwwo....',
  '....owwwwwwo....',
  '....opzppzpo....',
  '.....op..po.....',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
];

const BAT_ASLEEP_BREATHING: TextureGrid = [
  '................',
  '......o..o......',
  '......oppo......',
  '.....owwppo.....',
  '....owwwwppo....',
  '...owwwwwwpo....',
  '...owwwwwwwo....',
  '....owwwwwwo....',
  '....opzppzpo....',
  '.....op..po.....',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
];

const BAT_ASLEEP_PALETTE = {
  o: '#241a38', // outline
  p: '#6f6486', // dozing fur
  w: '#55496e', // folded wings
  z: '#14101f', // closed eyes
};

const DYNAMITE_STICKS: TextureGrid = [
  '.........f......',
  '........f.......',
  '...oooooooooo...',
  '...orrorrorro...',
  '...orrorrorro...',
  '...oyyoyyoyyo...',
  '...orrorrorro...',
  '...oRRoRRoRRo...',
  '...orrorrorro...',
  '...oRRoRRoRRo...',
  '...oooooooooo...',
  '................',
  '................',
  '................',
];

const DYNAMITE_FRAMES: TextureGrid[] = [
  ['.........s......', '........sSs.....', ...DYNAMITE_STICKS],
  ['........s.s.....', '.........S......', ...DYNAMITE_STICKS],
];

const DYNAMITE_PALETTE = {
  o: '#401510', // outline / caps
  r: '#ff5a3c', // stick
  R: '#b53218', // stick shade
  y: '#ffe36e', // wrap band
  f: '#c9a05a', // fuse
  s: '#fff7d1', // spark core
  S: '#ffa53c', // spark glow
};

const FLARE_STICK: TextureGrid = [
  '.......yy.......',
  '.......kk.......',
  '.......kk.......',
  '.......kk.......',
  '.......kk.......',
  '.......kk.......',
  '......kkkk......',
  '................',
  '................',
];

const FLARE_FRAMES: TextureGrid[] = [
  [
    '................',
    '.......y........',
    '......ygy.......',
    '......yggy......',
    '.....ygwwgy.....',
    '.....ygwwgy.....',
    '......ygwgy.....',
    ...FLARE_STICK,
  ],
  [
    '................',
    '........y.......',
    '.......ygy......',
    '......yggy......',
    '......ygwgy.....',
    '.....ygwwgy.....',
    '......ygwgy.....',
    ...FLARE_STICK,
  ],
];

const FLARE_PALETTE = {
  k: '#8a2a1a', // stick
  w: '#fff7d1', // flame core
  y: '#ffe36e', // flame mid
  g: '#ffa53c', // flame edge
};

const PORTAL_SWIRL_A: TextureGrid = [
  '................',
  '................',
  '.....oooooo.....',
  '....oppppppo....',
  '...opllpppppo...',
  '..oplpppppplpo..',
  '..opppcccppppo..',
  '..oppccccclppo..',
  '..opplcccccppo..',
  '..oppppcccpppo..',
  '..oplpppppplpo..',
  '...opppppllpo...',
  '....oppppppo....',
  '.....oooooo.....',
  '................',
  '................',
];

const PORTAL_SWIRL_B: TextureGrid = [
  '................',
  '................',
  '.....oooooo.....',
  '....opplpppo....',
  '...opppppllpo...',
  '..opplpppppppo..',
  '..oplpcccppppo..',
  '..opplcccccppo..',
  '..oppccccclppo..',
  '..oppplcccpplo..',
  '..oppppppplppo..',
  '...opllpppppo...',
  '....opplpppo....',
  '.....oooooo.....',
  '................',
  '................',
];

const PORTAL_PALETTE = {
  o: '#5b2a80', // rim
  p: '#a85bd8', // swirl
  l: '#d9a0f5', // swirl highlight
  c: '#2a1240', // void center
};

export const ENTITY_SPRITES: Record<string, SpriteDefinition> = {
  player: { frames: PLAYER_FRAMES, palette: PLAYER_PALETTE },
  bat: { frames: [BAT_WINGS_UP, BAT_WINGS_DOWN], palette: BAT_PALETTE },
  bat_asleep: {
    frames: [BAT_ASLEEP_HANGING, BAT_ASLEEP_BREATHING],
    palette: BAT_ASLEEP_PALETTE,
  },
  dynamite: { frames: DYNAMITE_FRAMES, palette: DYNAMITE_PALETTE },
  flare: { frames: FLARE_FRAMES, palette: FLARE_PALETTE },
  portal: { frames: [PORTAL_SWIRL_A, PORTAL_SWIRL_B], palette: PORTAL_PALETTE },
};
