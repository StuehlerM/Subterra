import { describe, expect, it } from 'vitest';
import { parseGrid } from '../../src/infra/sprites/grid';
import {
  BATTERY_INTERIOR,
  DIGIT_FONT,
  EMBLEM,
  FONT_PALETTE,
  PANELS,
  PANEL_CORNER,
  UI_ICONS,
} from '../../src/infra/sprites/art/ui';

const GLYPH_W = 3;
const GLYPH_H = 5;
const ICON_SIZE = 16;
const PANEL_SIZE = 24;
const EMBLEM_SIZE = 32;

describe('digit font', () => {
  it('has a 3x5 glyph for every digit and the slash', () => {
    for (const char of '0123456789/') {
      const glyph = DIGIT_FONT[char];
      expect(glyph, char).toBeDefined();
      const parsed = parseGrid(glyph, FONT_PALETTE);
      expect(parsed.width, char).toBe(GLYPH_W);
      expect(parsed.height, char).toBe(GLYPH_H);
    }
  });

  it('digits are distinct from each other', () => {
    const shapes = new Set(Object.values(DIGIT_FONT).map((g) => g.join('\n')));
    expect(shapes.size).toBe(Object.keys(DIGIT_FONT).length);
  });
});

describe('ui icons', () => {
  it('every icon parses and is 16x16', () => {
    for (const [name, sprite] of Object.entries(UI_ICONS)) {
      const parsed = parseGrid(sprite.frames[0], sprite.palette);
      expect(parsed.width, name).toBe(ICON_SIZE);
      expect(parsed.height, name).toBe(ICON_SIZE);
    }
  });

  it('covers everything the HUD, shop, title and pause screens need', () => {
    const needed = [
      'coin', 'crate', 'battery', 'dynamite', 'flare', 'depth',
      'pickaxe', 'lightning', 'blast', 'star', 'x_key', 'pause', 'plus',
      'drill_down', 'warning',
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
