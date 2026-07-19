// Generates simple placeholder PNGs for every game asset so the assets pipeline
// works out of the box. Replace any file in public/assets/** with your own art
// (same filename) and reload — the game will pick it up. Existing files are kept.
//   node scripts/gen-placeholders.mjs
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodePng, hexToRgb } from './png.mjs';

const SIZE = 32;
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets');

const TILES = {
  sand: '#c2a15a',
  bedrock: '#3a3f4b',
  coal: '#2f3033',
  copper: '#b87333',
  iron: '#a7a19a',
  silver: '#d7dce0',
  gold: '#ffcf3f',
  gem: '#4fd0e3',
  rock: '#808791',
};

const ENTITIES = {
  player: '#ffd34d',
  bat: '#6b4fa3',
  bat_asleep: '#8a8f98',
  dynamite: '#ff5a3c',
  flare: '#ffa53c',
  portal: '#a85bd8',
};

function makeBuffer(color, shape) {
  const [r, g, b] = hexToRgb(color);
  const rgba = Buffer.alloc(SIZE * SIZE * 4);
  const c = (SIZE - 1) / 2;
  const radius = SIZE * 0.42;
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      const i = (y * SIZE + x) * 4;
      const inside = shape === 'circle' ? Math.hypot(x - c, y - c) <= radius : true;
      rgba[i] = r;
      rgba[i + 1] = g;
      rgba[i + 2] = b;
      rgba[i + 3] = inside ? 255 : 0;
    }
  }
  return rgba;
}

function write(folder, name, color, shape) {
  const dir = join(ROOT, folder);
  mkdirSync(dir, { recursive: true });
  const path = join(dir, `${name}.png`);
  if (existsSync(path)) return false; // never clobber existing (possibly custom) art
  writeFileSync(path, encodePng(SIZE, SIZE, makeBuffer(color, shape)));
  return true;
}

let created = 0;
for (const [name, color] of Object.entries(TILES)) if (write('tiles', name, color, 'square')) created++;
for (const [name, color] of Object.entries(ENTITIES)) if (write('entities', name, color, 'circle')) created++;
console.log(`Created ${created} missing placeholder(s) in ${ROOT} (existing files kept).`);
