import { STRINGS } from '../../app/strings';
import { TileType } from '../../domain/tiles';
import { AssetRegistry } from '../AssetRegistry';
import { SlotSummary, SLOT_COUNT } from '../SaveRepository';
import { frameIndexAt } from '../sprites/animation';
import { variantIndexAt } from '../sprites/variants';
import { UiPainter } from './UiPainter';

const SCALE = 2;
const ICON_PX = 16 * SCALE;
const TILE_PX = 32;
const GROUND_ROWS = 2;
const EMBLEM_SCALE = 5;
const FLANK_SCALE = 3;
const BLINK_MS = 600;
const CARD_W = 150;
const CARD_H = 150;
const CARD_GAP = 24;
const SLOT_DIGIT_SCALE = 4;
const PAUSE_PANEL = 160;
const TITLE_TEXT_SCALE = 4;
const LABEL_TEXT_SCALE = 2;
const GLYPH_H = 5;

/**
 * Full-screen painters for the non-gameplay screens (title, slot picker,
 * pause). They share a sky-and-sand backdrop drawn from the game's own tile
 * art, so the menus look like the world they lead into.
 */
export class ScreenPainters {
  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly ui: UiPainter,
    private readonly world: AssetRegistry,
  ) {}

  title(timeMs: number): void {
    this.backdrop();
    const { canvas } = this.ctx;
    const emblemPx = this.ui.assets.emblem.width * EMBLEM_SCALE;
    const x = Math.round((canvas.width - emblemPx) / 2);
    const y = Math.round(canvas.height * 0.16);
    this.ctx.drawImage(this.ui.assets.emblem.frame(0), x, y, emblemPx, emblemPx);

    const flankPx = 16 * FLANK_SCALE;
    const flankY = y + Math.round((emblemPx - flankPx) / 2);
    this.ui.icon('pickaxe', x - flankPx - 16, flankY, FLANK_SCALE);
    this.ui.icon('pickaxe', x + emblemPx + 16, flankY, FLANK_SCALE);

    const titleW = this.ui.textWidth(STRINGS.title, TITLE_TEXT_SCALE);
    const titleY = y + emblemPx + 24;
    this.ui.text(STRINGS.title, Math.round((canvas.width - titleW) / 2), titleY, TITLE_TEXT_SCALE);

    if (frameIndexAt(timeMs, 2, BLINK_MS) === 0) {
      const promptW = ICON_PX + 8 + this.ui.textWidth(STRINGS.pressX, LABEL_TEXT_SCALE);
      const promptX = Math.round((canvas.width - promptW) / 2);
      const promptY = titleY + GLYPH_H * TITLE_TEXT_SCALE + 28;
      this.ui.icon('x_key', promptX, promptY, SCALE);
      const textY = promptY + Math.round((ICON_PX - GLYPH_H * LABEL_TEXT_SCALE) / 2);
      this.ui.text(STRINGS.pressX, promptX + ICON_PX + 8, textY, LABEL_TEXT_SCALE);
    }
  }

  slotSelect(summaries: (SlotSummary | null)[], cursor: number, timeMs: number): void {
    this.backdrop();
    const { canvas } = this.ctx;
    const rowW = SLOT_COUNT * CARD_W + (SLOT_COUNT - 1) * CARD_GAP;
    const startX = Math.round((canvas.width - rowW) / 2);
    const y = Math.round((canvas.height - CARD_H) / 2);

    summaries.forEach((summary, slot) => {
      const x = startX + slot * (CARD_W + CARD_GAP);
      this.slotCard(summary, slot, x, y);
      if (slot === cursor) {
        this.ui.highlight(x, y, CARD_W, CARD_H, SCALE);
        if (frameIndexAt(timeMs, 2, BLINK_MS) === 0) {
          this.ui.icon('x_key', x + Math.round((CARD_W - ICON_PX) / 2), y + CARD_H + 12, SCALE);
        }
      }
    });
  }

  pause(): void {
    this.ui.dim(0.6);
    const { canvas } = this.ctx;
    const x = Math.round((canvas.width - PAUSE_PANEL) / 2);
    const y = Math.round((canvas.height - PAUSE_PANEL) / 2);
    this.ui.nineSlice(this.ui.assets.panel('stone'), x, y, PAUSE_PANEL, PAUSE_PANEL, SCALE);
    const iconPx = 16 * 5;
    this.ui.icon('pause', x + (PAUSE_PANEL - iconPx) / 2, y + (PAUSE_PANEL - iconPx) / 2 - 8, 5);
    const labelW = this.ui.textWidth(STRINGS.paused, LABEL_TEXT_SCALE);
    this.ui.text(
      STRINGS.paused,
      x + Math.round((PAUSE_PANEL - labelW) / 2),
      y + PAUSE_PANEL - GLYPH_H * LABEL_TEXT_SCALE - 16,
      LABEL_TEXT_SCALE,
    );
  }

  /** Sky ramp above two rows of sand — the world the menus lead into. */
  private backdrop(): void {
    const { canvas } = this.ctx;
    this.ctx.imageSmoothingEnabled = false;
    const groundY = canvas.height - GROUND_ROWS * TILE_PX;
    const sky = this.world.background('sky');
    this.ctx.drawImage(sky.frame(0), 0, 0, canvas.width, groundY);
    const sand = this.world.tile(TileType.Sand);
    if (!sand) return;
    for (let row = 0; row < GROUND_ROWS; row++) {
      for (let x = 0; x < canvas.width; x += TILE_PX) {
        const variant = variantIndexAt(x / TILE_PX, row, sand.frameCount);
        this.ctx.drawImage(sand.frame(variant), x, groundY + row * TILE_PX, TILE_PX, TILE_PX);
      }
    }
  }

  private slotCard(summary: SlotSummary | null, slot: number, x: number, y: number): void {
    this.ui.nineSlice(this.ui.assets.panel('wood'), x, y, CARD_W, CARD_H, SCALE);

    const digit = `${slot + 1}`;
    const digitW = this.ui.textWidth(digit, SLOT_DIGIT_SCALE);
    this.ui.text(digit, x + Math.round((CARD_W - digitW) / 2), y + 18, SLOT_DIGIT_SCALE);

    const contentY = y + CARD_H - ICON_PX - 24;
    if (summary === null) {
      this.ui.icon('plus', x + Math.round((CARD_W - ICON_PX) / 2), contentY - 10, SCALE);
      const labelW = this.ui.textWidth(STRINGS.newGame, LABEL_TEXT_SCALE);
      this.ui.text(
        STRINGS.newGame,
        x + Math.round((CARD_W - labelW) / 2),
        contentY + ICON_PX - 4,
        LABEL_TEXT_SCALE,
      );
      return;
    }
    const text = `${summary.money}`;
    const width = ICON_PX + 6 + this.ui.textWidth(text, SCALE);
    const iconX = x + Math.round((CARD_W - width) / 2);
    this.ui.icon('coin', iconX, contentY, SCALE);
    const textY = contentY + Math.round((ICON_PX - 5 * SCALE) / 2);
    this.ui.text(text, iconX + ICON_PX + 6, textY, SCALE);
  }
}
