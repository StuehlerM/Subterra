import { UiPainter } from './UiPainter';

const SCALE = 4;
const TEXT_SCALE = 4;
const PADDING_X = 26;
const PADDING_Y = 18;
const BOTTOM_MARGIN = 28;
const GLYPH_H = 5;

/** The tutorial banner: one short sentence on a wood plank, bottom-center. */
export class HintPainter {
  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly ui: UiPainter,
  ) {}

  draw(hint: string): void {
    const { canvas } = this.ctx;
    const textW = this.ui.textWidth(hint, TEXT_SCALE);
    const w = textW + PADDING_X * 2;
    const h = GLYPH_H * TEXT_SCALE + PADDING_Y * 2;
    const x = Math.round((canvas.width - w) / 2);
    const y = canvas.height - h - BOTTOM_MARGIN;
    this.ui.nineSlice(this.ui.assets.panel('wood'), x, y, w, h, SCALE);
    this.ui.text(hint, x + PADDING_X, y + PADDING_Y, TEXT_SCALE);
  }
}
