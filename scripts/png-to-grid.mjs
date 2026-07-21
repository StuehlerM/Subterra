// PNG -> text-grid sprite converter (zero dependencies, own PNG decoder).
//
//   node scripts/png-to-grid.mjs sprite.png [--frames N] [--palette shared.json]
//                                [--tolerance N] [--force-nearest] [--name NAME]
//
// Draw in any pixel editor, export a PNG (animation frames as a horizontal
// strip), run the converter, paste the output into src/infra/sprites/art/**.
// Transparent pixels become dots; opaque colors get keys most-used-first.
// With --palette every pixel must match an existing shared palette (strict by
// default; --tolerance allows small drift, --force-nearest snaps everything).
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import { pathToFileURL } from 'node:url';
import { inflateSync } from 'node:zlib';

const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const OPAQUE_THRESHOLD = 128;
const KEY_ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const CHANNELS_PER_COLOR_TYPE = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 };
const FILTER = { NONE: 0, SUB: 1, UP: 2, AVERAGE: 3, PAETH: 4 };

/** Decodes an 8-bit-depth, non-interlaced PNG into RGBA pixels. */
export function decodePng(buffer) {
  const { header, palette, transparency, data } = readChunks(buffer);
  const channels = CHANNELS_PER_COLOR_TYPE[header.colorType];
  if (!channels) throw new Error(`Unsupported PNG color type ${header.colorType}`);
  if (header.bitDepth !== 8) throw new Error(`Unsupported PNG bit depth ${header.bitDepth} (only 8)`);
  if (header.interlace !== 0) throw new Error('Interlaced PNGs are not supported');

  const raw = inflateSync(data);
  const scanlines = unfilter(raw, header.width, header.height, channels);
  return {
    width: header.width,
    height: header.height,
    pixels: toRgba(scanlines, header, palette, transparency),
  };
}

/**
 * Converts PNG bytes into a text sprite: `frames` (grids), `palette`, and a
 * `toCode(name)` formatter that emits paste-ready source.
 */
export function convertPngToSprite(buffer, { frames = 1, palette, tolerance = 0, forceNearest = false } = {}) {
  const image = decodePng(buffer);
  if (image.width % frames !== 0) {
    throw new Error(`Strip width ${image.width} is not divisible into ${frames} frames`);
  }
  const charAt = palette
    ? matchedPaletteLookup(palette, tolerance, forceNearest)
    : derivedPaletteLookup(image);
  const frameWidth = image.width / frames;
  const grids = [];
  for (let f = 0; f < frames; f++) {
    const grid = [];
    for (let y = 0; y < image.height; y++) {
      let row = '';
      for (let x = 0; x < frameWidth; x++) row += charAt(image, f * frameWidth + x, y);
      grid.push(row);
    }
    grids.push(grid);
  }
  const usedPalette = palette ?? charAt.derivedPalette;
  return { frames: grids, palette: usedPalette, toCode: (name) => formatSprite(name, grids, usedPalette) };
}

// ---------------------------------------------------------------- formatting

function formatSprite(name, grids, palette) {
  const frameBlocks = grids
    .map((grid) => `  [\n${grid.map((row) => `    '${row}',`).join('\n')}\n  ],`)
    .join('\n');
  const paletteLines = Object.entries(palette)
    .map(([char, hex]) => `  ${char}: '${hex}',`)
    .join('\n');
  return (
    `const ${name}_FRAMES: TextureGrid[] = [\n${frameBlocks}\n];\n\n` +
    `const ${name}_PALETTE: Record<string, string> = {\n${paletteLines}\n};\n`
  );
}

// ---------------------------------------------------------- palette matching

function rgbaAt(image, x, y) {
  const i = (y * image.width + x) * 4;
  return [image.pixels[i], image.pixels[i + 1], image.pixels[i + 2], image.pixels[i + 3]];
}

function toHex([r, g, b]) {
  return `#${[r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')}`;
}

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function distanceSquared(a, b) {
  return (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2 + (a[2] - b[2]) ** 2;
}

function maxChannelDiff(a, b) {
  return Math.max(Math.abs(a[0] - b[0]), Math.abs(a[1] - b[1]), Math.abs(a[2] - b[2]));
}

/** Strict/tolerant/nearest matching against an existing shared palette. */
function matchedPaletteLookup(palette, tolerance, forceNearest) {
  const entries = Object.entries(palette).map(([char, hex]) => ({ char, rgb: hexToRgb(hex) }));
  return (image, x, y) => {
    const rgba = rgbaAt(image, x, y);
    if (rgba[3] < OPAQUE_THRESHOLD) return '.';
    const allowed = forceNearest
      ? entries
      : entries.filter((e) => maxChannelDiff(e.rgb, rgba) <= tolerance);
    if (allowed.length === 0) {
      throw new Error(
        `Pixel at (${x}, ${y}) has color ${toHex(rgba)} which is not in the palette ` +
          '(use --tolerance or --force-nearest)',
      );
    }
    let best = allowed[0];
    for (const e of allowed) if (distanceSquared(e.rgb, rgba) < distanceSquared(best.rgb, rgba)) best = e;
    return best.char;
  };
}

/** Assigns keys to the image's own colors, most-used-first. */
function derivedPaletteLookup(image) {
  const counts = new Map();
  for (let y = 0; y < image.height; y++) {
    for (let x = 0; x < image.width; x++) {
      const rgba = rgbaAt(image, x, y);
      if (rgba[3] < OPAQUE_THRESHOLD) continue;
      const hex = toHex(rgba);
      counts.set(hex, (counts.get(hex) ?? 0) + 1);
    }
  }
  const ranked = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([hex]) => hex);
  if (ranked.length > KEY_ALPHABET.length) {
    throw new Error(`Image has ${ranked.length} colors; at most ${KEY_ALPHABET.length} are supported`);
  }
  const charByHex = new Map(ranked.map((hex, i) => [hex, KEY_ALPHABET[i]]));
  const lookup = (image_, x, y) => {
    const rgba = rgbaAt(image_, x, y);
    return rgba[3] < OPAQUE_THRESHOLD ? '.' : charByHex.get(toHex(rgba));
  };
  lookup.derivedPalette = Object.fromEntries(ranked.map((hex, i) => [KEY_ALPHABET[i], hex]));
  return lookup;
}

// ------------------------------------------------------------- PNG decoding

function readChunks(buffer) {
  if (!buffer.subarray(0, 8).equals(PNG_SIGNATURE)) throw new Error('Not a PNG file');
  let header;
  let palette = null;
  let transparency = null;
  const idat = [];
  let offset = 8;
  while (offset < buffer.length) {
    const length = buffer.readUInt32BE(offset);
    const type = buffer.toString('ascii', offset + 4, offset + 8);
    const data = buffer.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      header = {
        width: data.readUInt32BE(0),
        height: data.readUInt32BE(4),
        bitDepth: data[8],
        colorType: data[9],
        interlace: data[12],
      };
    } else if (type === 'PLTE') palette = Buffer.from(data);
    else if (type === 'tRNS') transparency = Buffer.from(data);
    else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    offset += 12 + length; // length + type + data + CRC
  }
  if (!header) throw new Error('PNG is missing its IHDR chunk');
  return { header, palette, transparency, data: Buffer.concat(idat) };
}

function unfilter(raw, width, height, channels) {
  const stride = width * channels;
  const out = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    const line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let i = 0; i < stride; i++) {
      const left = i >= channels ? out[y * stride + i - channels] : 0;
      const up = y > 0 ? out[(y - 1) * stride + i] : 0;
      const upLeft = y > 0 && i >= channels ? out[(y - 1) * stride + i - channels] : 0;
      out[y * stride + i] = (line[i] + predict(filter, left, up, upLeft)) & 0xff;
    }
  }
  return out;
}

function predict(filter, left, up, upLeft) {
  switch (filter) {
    case FILTER.NONE:
      return 0;
    case FILTER.SUB:
      return left;
    case FILTER.UP:
      return up;
    case FILTER.AVERAGE:
      return (left + up) >> 1;
    case FILTER.PAETH:
      return paeth(left, up, upLeft);
    default:
      throw new Error(`Unknown PNG filter type ${filter}`);
  }
}

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a);
  const pb = Math.abs(p - b);
  const pc = Math.abs(p - c);
  if (pa <= pb && pa <= pc) return a;
  return pb <= pc ? b : c;
}

function toRgba(scanlines, header, palette, transparency) {
  const { width, height, colorType } = header;
  const channels = CHANNELS_PER_COLOR_TYPE[colorType];
  const out = new Uint8Array(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    const src = p * channels;
    const dst = p * 4;
    if (colorType === 6) out.set(scanlines.subarray(src, src + 4), dst);
    else if (colorType === 2) {
      out.set(scanlines.subarray(src, src + 3), dst);
      out[dst + 3] = 255;
    } else if (colorType === 0) {
      out[dst] = out[dst + 1] = out[dst + 2] = scanlines[src];
      out[dst + 3] = 255;
    } else if (colorType === 4) {
      out[dst] = out[dst + 1] = out[dst + 2] = scanlines[src];
      out[dst + 3] = scanlines[src + 1];
    } else {
      const index = scanlines[src];
      if (!palette) throw new Error('Indexed PNG is missing its PLTE chunk');
      out.set(palette.subarray(index * 3, index * 3 + 3), dst);
      out[dst + 3] = transparency && index < transparency.length ? transparency[index] : 255;
    }
  }
  return out;
}

// --------------------------------------------------------------------- CLI

function main(argv) {
  const args = [...argv];
  const options = {};
  let file;
  let name;
  while (args.length > 0) {
    const arg = args.shift();
    if (arg === '--frames') options.frames = Number(args.shift());
    else if (arg === '--palette') options.palette = JSON.parse(readFileSync(args.shift(), 'utf8'));
    else if (arg === '--tolerance') options.tolerance = Number(args.shift());
    else if (arg === '--force-nearest') options.forceNearest = true;
    else if (arg === '--name') name = args.shift();
    else file = arg;
  }
  if (!file) {
    console.error('Usage: node scripts/png-to-grid.mjs sprite.png [--frames N] [--palette shared.json] [--tolerance N] [--force-nearest] [--name NAME]');
    process.exit(1);
  }
  name ??= basename(file).replace(/\.png$/i, '').replace(/[^a-zA-Z0-9]+/g, '_').toUpperCase();
  process.stdout.write(convertPngToSprite(readFileSync(file), options).toCode(name));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main(process.argv.slice(2));
}
