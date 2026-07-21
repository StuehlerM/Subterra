import { UiPainter } from './UiPainter';

const TEXT_SCALE = 4;
const TOP_MARGIN = 28;
const SHADOW_OFFSET = 3;

/**
 * The tutorial hint: plain white pixel text, top-center of the screen, with a
 * dark drop shadow so it stays readable over sky and cave alike.
 */
export class HintPainter {
  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly ui: UiPainter,
  ) {}

  draw(hint: string): void {
    const { canvas } = this.ctx;
    const textW = this.ui.textWidth(hint, TEXT_SCALE);
    const x = Math.round((canvas.width - textW) / 2);

    this.ctx.save();
    this.ctx.filter = 'brightness(0)'; // the glyphs are baked white: this is the shadow
    this.ui.text(hint, x + SHADOW_OFFSET, TOP_MARGIN + SHADOW_OFFSET, TEXT_SCALE);
    this.ctx.restore();
    this.ui.text(hint, x, TOP_MARGIN, TEXT_SCALE);
  }
}
