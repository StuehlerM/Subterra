import { DIGIT_FONT, EMBLEM, FONT_PALETTE, PANELS, UI_ICONS } from '../sprites/art/ui';
import { BakedSprite } from '../sprites/bake';

/** Bakes every UI grid (glyphs, icons, panels, emblem) once, at startup. */
export class UiAssets {
  private readonly glyphs = new Map<string, BakedSprite>();
  private readonly icons = new Map<string, BakedSprite>();
  private readonly panels = new Map<string, BakedSprite>();
  readonly emblem: BakedSprite;

  private constructor() {
    for (const [char, grid] of Object.entries(DIGIT_FONT)) {
      this.glyphs.set(char, BakedSprite.bake({ frames: [grid], palette: FONT_PALETTE }));
    }
    for (const [name, sprite] of Object.entries(UI_ICONS)) {
      this.icons.set(name, BakedSprite.bake(sprite));
    }
    for (const [name, sprite] of Object.entries(PANELS)) {
      this.panels.set(name, BakedSprite.bake(sprite));
    }
    this.emblem = BakedSprite.bake(EMBLEM);
  }

  static withDefaults(): UiAssets {
    return new UiAssets();
  }

  glyph(char: string): BakedSprite | null {
    return this.glyphs.get(char) ?? null;
  }

  icon(name: string): BakedSprite {
    return this.demand(this.icons, name, 'icon');
  }

  panel(name: 'wood' | 'stone'): BakedSprite {
    return this.demand(this.panels, name, 'panel');
  }

  private demand(map: Map<string, BakedSprite>, name: string, kind: string): BakedSprite {
    const sprite = map.get(name);
    if (!sprite) throw new Error(`Unknown UI ${kind} '${name}'`);
    return sprite;
  }
}
