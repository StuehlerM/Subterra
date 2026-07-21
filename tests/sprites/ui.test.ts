import { describe, expect, it } from 'vitest';
import { parseGrid } from '../../src/infra/sprites/grid';
import {
  BATTERY_INTERIOR,
  BATTERY_SEGMENTS,
  EMBLEM,
  FONT_PALETTE,
  PANELS,
  PANEL_CORNER,
  PIXEL_FONT,
  UI_ICONS,
} from '../../src/infra/sprites/art/ui';

const GLYPH_W = 3;
const GLYPH_H = 5;
const ICON_SIZE = 16;
const PANEL_SIZE = 24;
const EMBLEM_SIZE = 32;

describe('pixel font', () => {
  it('has a 3x5 glyph for every digit, letter and punctuation mark', () => {
    for (const char of "0123456789/ABCDEFGHIJKLMNOPQRSTUVWXYZ\u00c5\u00c4\u00d6\u00dc!?'") {
      const glyph = PIXEL_FONT[char];
      expect(glyph, char).toBeDefined();
      const parsed = parseGrid(glyph, FONT_PALETTE);
      expect(parsed.width, char).toBe(GLYPH_W);
      expect(parsed.height, char).toBe(GLYPH_H);
    }
  });

  it('glyphs are distinct (except the classic O/0 pair)', () => {
    const entries = Object.entries(PIXEL_FONT).filter(([char]) => char !== 'O');
    const shapes = new Set(entries.map(([, g]) => g.join('\n')));
    expect(shapes.size).toBe(entries.length);
  });
});

describe('ui icons', () => {
  it('every icon parses; all but the wide battery are 16x16', () => {
    for (const [name, sprite] of Object.entries(UI_ICONS)) {
      const parsed = parseGrid(sprite.frames[0], sprite.palette);
      if (name === 'battery_wide') {
        expect(parsed.width, name).toBe(26);
        expect(parsed.height, name).toBe(12);
        continue;
      }
      expect(parsed.width, name).toBe(ICON_SIZE);
      expect(parsed.height, name).toBe(ICON_SIZE);
    }
  });

  it('the battery segments fit inside the wide shell', () => {
    const { x, y, w, h, gap, count } = BATTERY_SEGMENTS;
    expect(count).toBe(5);
    expect(x + count * w + (count - 1) * gap).toBeLessThan(26 - 1); // inside outline
    expect(y + h).toBeLessThan(12 - 1);
  });

  it('covers everything the HUD, shop, title and pause screens need', () => {
    const needed = [
      'coin', 'crate', 'battery', 'dynamite', 'flare', 'depth',
      'pickaxe', 'lightning', 'blast', 'star', 'x_key', 'pause', 'plus',
      'drill_down', 'warning', 'speaker_on', 'speaker_off', 'z_key', 'battery_wide',
    ];
    for (const name of needed) expect(UI_ICONS[name], name).toBeDefined();
  });
});

describe('panels', () => {
  it('wood and stone share one 24x24 grid shape with different palettes', () => {
    const wood = parseGrid(PANELS.wood.frames[0], PANELS.wood.palette);
    expect(wood.width).toBe(PANEL_SIZE);
    expect(wood.height).toBe(PANEL_SIZE);
    expect(PANELS.stone.frames[0].join('\n')).toBe(PANELS.wood.frames[0].join('\n'));
    expect(PANELS.stone.palette).not.toEqual(PANELS.wood.palette);
    expect(PANEL_CORNER).toBeGreaterThan(0);
    expect(PANEL_CORNER * 2).toBeLessThan(PANEL_SIZE);
  });
});

describe('emblem and battery', () => {
  it('the title emblem parses at 32x32', () => {
    const parsed = parseGrid(EMBLEM.frames[0], EMBLEM.palette);
    expect(parsed.width).toBe(EMBLEM_SIZE);
    expect(parsed.height).toBe(EMBLEM_SIZE);
  });

  it('the battery interior sits inside the battery icon', () => {
    const { x, y, w, h } = BATTERY_INTERIOR;
    expect(x).toBeGreaterThan(0);
    expect(y).toBeGreaterThan(0);
    expect(x + w).toBeLessThan(ICON_SIZE);
    expect(y + h).toBeLessThan(ICON_SIZE);
  });
});
