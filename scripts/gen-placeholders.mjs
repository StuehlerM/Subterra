// Generates simple placeholder PNGs for every game asset so the assets pipeline
// works out of the box. Replace any file in public/assets/** with your own art
// (same filename) and reload — the game will pick it up. Re-run with:
//   node scripts/gen-placeholders.mjs
import { deflateSync } from 'node:zlib';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

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

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

// RGBA pixel buffer -> PNG file bytes.
function encodePng(width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (width * 4 + 1)] = 0; // filter: none
    rgba.copy(raw, y * (width * 4 + 1) + 1, y * width * 4, (y + 1) * width * 4);
  }
  const idat = deflateSync(raw);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // colour type: RGBA
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function chunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const out = Buffer.alloc(8 + data.length + 4);
  out.writeUInt32BE(data.length, 0);
  body.copy(out, 4);
  out.writeUInt32BE(crc32(body) >>> 0, 8 + data.length);
  return out;
}

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = CRC_TABLE[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return c ^ 0xffffffff;
}

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
