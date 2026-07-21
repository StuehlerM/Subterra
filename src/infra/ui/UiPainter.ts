import { PANEL_CORNER } from '../sprites/art/ui';
import { BakedSprite } from '../sprites/bake';
import { UiAssets } from './UiAssets';

/** Art pixels a glyph advances the cursor (3 wide + 1 spacing). */
const GLYPH_ADVANCE = 4;
const GLYPH_WIDTH = 3;
const GLYPH_HEIGHT = 5;

/**
 * Low-level canvas helpers for the pixel UI: nine-slice panels, icons and the
 * tiny digit font. All sizes are given in art pixels times `scale`.
 */
export class UiPainter {
  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    readonly assets: UiAssets,
  ) {}

  /** Stretches a panel to any size while keeping its border crisp. */
  nineSlice(panel: BakedSprite, x: number, y: number, w: number, h: number, scale: number): void {
    const src = panel.frame(0);
    const size = panel.width;
    const c = PANEL_CORNER;
    const cs = c * scale;
    const mid = size - 2 * c;
    const [mw, mh] = [w - 2 * cs, h - 2 * cs];
    const patch = (sx: number, sy: number, sw: number, sh: number, dx: number, dy: number, dw: number, dh: number) =>
      this.ctx.drawImage(src as CanvasImageSource, sx, sy, sw, sh, dx, dy, dw, dh);

    patch(0, 0, c, c, x, y, cs, cs);
    patch(c, 0, mid, c, x + cs, y, mw, cs);
    patch(size - c, 0, c, c, x + w - cs, y, cs, cs);
    patch(0, c, c, mid, x, y + cs, cs, mh);
    patch(c, c, mid, mid, x + cs, y + cs, mw, mh);
    patch(size - c, c, c, mid, x + w - cs, y + cs, cs, mh);
    patch(0, size - c, c, c, x, y + h - cs, cs, cs);
    patch(c, size - c, mid, c, x + cs, y + h - cs, mw, cs);
    patch(size - c, size - c, c, c, x + w - cs, y + h - cs, cs, cs);
  }

  icon(name: string, x: number, y: number, scale: number): void {
    const sprite = this.assets.icon(name);
    this.ctx.drawImage(sprite.frame(0), x, y, sprite.width * scale, sprite.height * scale);
  }

  /** Draws a digit/slash string; returns the width drawn. */
  text(value: string, x: number, y: number, scale: number): number {
    let cursor = x;
    for (const char of value) {
      const glyph = this.assets.glyph(char);
      if (glyph) {
        this.ctx.drawImage(glyph.frame(0), cursor, y, GLYPH_WIDTH * scale, GLYPH_HEIGHT * scale);
      }
      cursor += GLYPH_ADVANCE * scale;
    }
    return cursor - x - scale; // drop the trailing spacing
  }

  textWidth(value: string, scale: number): number {
    return value.length * GLYPH_ADVANCE * scale - scale;
  }

  /** A soft dark veil over the whole canvas (menus, pause). */
  dim(alpha: number): void {
    const { canvas } = this.ctx;
    this.ctx.fillStyle = `rgba(8, 6, 12, ${alpha})`;
    this.ctx.fillRect(0, 0, canvas.width, canvas.height);
  }

  /** Selection border around a rectangle. */
  highlight(x: number, y: number, w: number, h: number, scale: number): void {
    this.ctx.strokeStyle = '#ffe36e';
    this.ctx.lineWidth = scale;
    this.ctx.strokeRect(x + scale / 2, y + scale / 2, w - scale, h - scale);
  }
}
