// Generates pixel-art placeholder BACKGROUNDS (surface sky + underground cave)
// in the style of the reference art. Replace public/assets/background/*.png with
// your own to change the setting. Existing files are kept.
//   node scripts/gen-backgrounds.mjs
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { encodePng, hexToRgb } from './png.mjs';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', 'public', 'assets', 'background');

function px(buf, w, x, y, [r, g, b], a = 255) {
  if (x < 0 || y < 0 || x >= w) return;
  const i = (y * w + x) * 4;
  buf[i] = r;
  buf[i + 1] = g;
  buf[i + 2] = b;
  buf[i + 3] = a;
}

function lerp(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

// ---- Surface sky: blue gradient, clouds, snowy mountains, pines, grass ----
function makeSky() {
  const W = 384;
  const H = 216;
  const buf = Buffer.alloc(W * H * 4);
  const skyTop = hexToRgb('#3f7cc0');
  const skyHorizon = hexToRgb('#cfeaf6');
  const grassTop = H - 16;

  const backPeaks = [
    { cx: 120, top: 96, slope: 0.8 },
    { cx: 270, top: 84, slope: 0.85 },
  ];
  const frontPeaks = [
    { cx: 192, top: 58, slope: 0.9 },
    { cx: 80, top: 118, slope: 1.1 },
    { cx: 310, top: 104, slope: 1.05 },
  ];
  const ridge = (peaks, x) => Math.max(0, Math.min(...peaks.map((p) => p.top + p.slope * Math.abs(x - p.cx))));

  for (let y = 0; y < H; y++) {
    const t = Math.min(1, y / (grassTop * 0.9));
    const sky = lerp(skyTop, skyHorizon, t);
    for (let x = 0; x < W; x++) px(buf, W, x, y, sky);
  }

  // clouds
  const clouds = [
    { cx: 70, cy: 40, rx: 34, ry: 10 },
    { cx: 210, cy: 28, rx: 26, ry: 8 },
    { cx: 320, cy: 52, rx: 30, ry: 9 },
  ];
  for (const c of clouds) {
    for (let y = c.cy - c.ry; y <= c.cy + c.ry; y++) {
      for (let x = c.cx - c.rx; x <= c.cx + c.rx; x++) {
        const d = ((x - c.cx) / c.rx) ** 2 + ((y - c.cy) / c.ry) ** 2;
        if (d <= 1) px(buf, W, x, y, [245, 250, 255]);
      }
    }
  }

  const back = hexToRgb('#8ea6cf');
  const front = hexToRgb('#5f78b4');
  const frontDark = hexToRgb('#4a5f96');
  const snow = hexToRgb('#f2f7ff');
  for (let x = 0; x < W; x++) {
    const rb = ridge(backPeaks, x);
    for (let y = Math.round(rb); y < grassTop; y++) px(buf, W, x, y, back);
    const rf = ridge(frontPeaks, x);
    for (let y = Math.round(rf); y < grassTop; y++) {
      const shade = x % 2 === 0 ? front : frontDark;
      const isSnow = y - rf < 10 && rf < 96;
      px(buf, W, x, y, isSnow ? snow : shade);
    }
  }

  // pine tree line just above the grass
  const green1 = hexToRgb('#264e2c');
  const green2 = hexToRgb('#1b3a22');
  const treeH = 20;
  for (let cx = 6; cx < W; cx += 11) {
    const h = treeH - ((cx * 7) % 6);
    for (let dy = 0; dy < h; dy++) {
      const halfW = Math.max(0, Math.round(((h - dy) / h) * 5));
      const y = grassTop - dy;
      for (let dx = -halfW; dx <= halfW; dx++) px(buf, W, cx + dx, y, dx % 2 === 0 ? green1 : green2);
    }
  }

  // grass band
  const grassA = hexToRgb('#57a545');
  const grassB = hexToRgb('#3c7f33');
  for (let y = grassTop; y < H; y++) {
    for (let x = 0; x < W; x++) px(buf, W, x, y, (x + y) % 2 === 0 ? grassA : grassB);
  }

  return { W, H, buf };
}

// ---- Underground cave: dark teal, tileable ----
function makeCave() {
  const S = 128;
  const buf = Buffer.alloc(S * S * 4);
  const dark = hexToRgb('#0b1c22');
  const light = hexToRgb('#18353f');
  const TAU = Math.PI * 2;
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const n =
        0.5 +
        0.28 * Math.sin((TAU * 2 * x) / S) * Math.cos((TAU * 2 * y) / S) +
        0.18 * Math.sin((TAU * 3 * (x + y)) / S) +
        0.12 * Math.sin((TAU * x) / S + (TAU * 2 * y) / S);
      const t = Math.max(0, Math.min(1, n));
      px(buf, S, x, y, lerp(dark, light, t));
    }
  }
  return { W: S, H: S, buf };
}

function write(name, { W, H, buf }) {
  mkdirSync(ROOT, { recursive: true });
  const path = join(ROOT, `${name}.png`);
  if (existsSync(path)) return false;
  writeFileSync(path, encodePng(W, H, buf));
  return true;
}

let created = 0;
if (write('sky', makeSky())) created++;
if (write('cave', makeCave())) created++;
console.log(`Created ${created} background(s) in ${ROOT} (existing files kept).`);
