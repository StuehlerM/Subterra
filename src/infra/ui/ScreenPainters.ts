import { str } from '../../app/strings';
import { TileType } from '../../domain/tiles';
import { AssetRegistry } from '../AssetRegistry';
import { SlotSummary, SLOT_COUNT } from '../SaveRepository';
import { frameIndexAt } from '../sprites/animation';
import { variantIndexAt } from '../sprites/variants';
import { UiPainter } from './UiPainter';

const SCALE = 4;
const ICON_PX = 16 * SCALE;
const TILE_PX = 64;
const GROUND_ROWS = 2;
/** Title-only: the exposed top-soil surface, drawn far bigger than in-game. */
const TITLE_GRASS_SCALE = 3;
const TITLE_GRASS_PX = TILE_PX * TITLE_GRASS_SCALE;
/** Title-only: the miner, standing large to one side of the menu. */
const TITLE_PLAYER_SCALE = 12;
const TITLE_PLAYER_X_FRACTION = 0.16;
const EMBLEM_SCALE = 6;
const FLANK_SCALE = 4;
const BLINK_MS = 600;
const CARD_W = 260;
const CARD_H = 250;
const CARD_GAP = 32;
const SLOT_DIGIT_SCALE = 6;
const PAUSE_PANEL = 280;
const TITLE_TEXT_SCALE = 8;
const LABEL_TEXT_SCALE = 4;
const GLYPH_H = 5;
const MENU_ROW_H = 56;
const MENU_PAD_X = 28;
const DELETE_BUTTON_H = 52;
const DELETE_COLOR = '#e04a3a';
const DIALOG_W = 420;
const DIALOG_H = 220;

/**
 * Full-screen painters for the non-gameplay screens (title menu, slot picker
 * with delete, options, pause). They share a sky-and-sand backdrop drawn from
 * the game's own tile art, so the menus look like the world they lead into.
 */
export class ScreenPainters {
  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly ui: UiPainter,
    private readonly world: AssetRegistry,
  ) {}

  title(cursor: number): void {
    this.titleBackdrop();
    const { canvas } = this.ctx;
    const emblemPx = this.ui.assets.emblem.width * EMBLEM_SCALE;
    const x = Math.round((canvas.width - emblemPx) / 2);
    const y = Math.round(canvas.height * 0.1);
    this.ctx.drawImage(this.ui.assets.emblem.frame(0), x, y, emblemPx, emblemPx);

    const flankPx = 16 * FLANK_SCALE;
    const flankY = y + Math.round((emblemPx - flankPx) / 2);
    this.ui.icon('pickaxe', x - flankPx - 20, flankY, FLANK_SCALE);
    this.ui.icon('pickaxe', x + emblemPx + 20, flankY, FLANK_SCALE);

    const titleW = this.ui.textWidth(str().title, TITLE_TEXT_SCALE);
    const titleY = y + emblemPx + 28;
    this.ui.text(str().title, Math.round((canvas.width - titleW) / 2), titleY, TITLE_TEXT_SCALE);

    const entries = [str().startGame, str().options];
    this.menu(entries, cursor, titleY + GLYPH_H * TITLE_TEXT_SCALE + 44);
  }

  /**
   * Title-only backdrop: blue sky over a single oversized band of the
   * grass-capped top-soil, with the miner standing large to one side — like a
   * zoomed-in shot of the surface the game starts on.
   */
  private titleBackdrop(): void {
    const { canvas } = this.ctx;
    this.ctx.imageSmoothingEnabled = false;
    const surfaceY = canvas.height - TITLE_GRASS_PX;
    const sky = this.world.background('sky');
    this.ctx.drawImage(sky.frame(0), 0, 0, canvas.width, surfaceY);

    const grass = this.world.grass();
    for (let x = 0; x < canvas.width; x += TITLE_GRASS_PX) {
      const variant = variantIndexAt(x / TITLE_GRASS_PX, 0, grass.frameCount);
      this.ctx.drawImage(grass.frame(variant), x, surfaceY, TITLE_GRASS_PX, TITLE_GRASS_PX);
    }

    this.titlePlayer(surfaceY);
  }

  /** The big miner standing on the surface, offset toward one side. */
  private titlePlayer(surfaceY: number): void {
    const { canvas } = this.ctx;
    const player = this.world.entity('player');
    const w = player.width * TITLE_PLAYER_SCALE;
    const h = player.height * TITLE_PLAYER_SCALE;
    const x = Math.round(canvas.width * TITLE_PLAYER_X_FRACTION - w / 2);
    const y = Math.round(surfaceY - h);
    this.ctx.drawImage(player.frame(0), x, y, w, h);
  }

  options(cursor: number, muted: boolean): void {
    this.backdrop();
    const { canvas } = this.ctx;
    const rows = [
      { icon: muted ? 'speaker_off' : 'speaker_on', text: `${str().sound} ${muted ? str().off : str().on}` },
      { icon: 'x_key', text: `${str().language} ${str().languageName}` },
    ];
    const textW = Math.max(...rows.map((r) => this.ui.textWidth(r.text, LABEL_TEXT_SCALE)));
    const panelW = MENU_PAD_X * 2 + ICON_PX + 14 + textW;
    const panelH = MENU_PAD_X * 2 + rows.length * (ICON_PX + 16) - 16;
    const panelX = Math.round((canvas.width - panelW) / 2);
    const panelY = Math.round((canvas.height - panelH) / 2);
    this.ui.nineSlice(this.ui.assets.panel('wood'), panelX, panelY, panelW, panelH, SCALE);

    rows.forEach((row, index) => {
      const rowY = panelY + MENU_PAD_X + index * (ICON_PX + 16);
      this.ui.icon(row.icon, panelX + MENU_PAD_X, rowY, SCALE);
      const textY = rowY + Math.round((ICON_PX - GLYPH_H * LABEL_TEXT_SCALE) / 2);
      this.ui.text(row.text, panelX + MENU_PAD_X + ICON_PX + 14, textY, LABEL_TEXT_SCALE);
      if (index === cursor) {
        this.ui.highlight(panelX + 8, rowY - 6, panelW - 16, ICON_PX + 12, SCALE);
      }
    });
  }

  slotSelect(summaries: (SlotSummary | null)[], cursor: number, onDeleteRow: boolean, timeMs: number): void {
    this.backdrop();
    const { canvas } = this.ctx;
    const rowW = SLOT_COUNT * CARD_W + (SLOT_COUNT - 1) * CARD_GAP;
    const startX = Math.round((canvas.width - rowW) / 2);
    const y = Math.round((canvas.height - CARD_H) / 2) - 30;

    summaries.forEach((summary, slot) => {
      const x = startX + slot * (CARD_W + CARD_GAP);
      this.slotCard(summary, slot, x, y);
      if (slot !== cursor) return;
      if (!onDeleteRow) this.ui.highlight(x, y, CARD_W, CARD_H, SCALE);
      if (summary !== null) this.deleteButton(x, y + CARD_H + 14, onDeleteRow);
      if (!onDeleteRow && frameIndexAt(timeMs, 2, BLINK_MS) === 0) {
        this.ui.icon('x_key', x + Math.round((CARD_W - ICON_PX) / 2), y - ICON_PX - 12, SCALE);
      }
    });
  }

  /** The DELETE? dialog over the slot picker. */
  confirmDelete(): void {
    this.ui.dim(0.55);
    const { canvas } = this.ctx;
    const x = Math.round((canvas.width - DIALOG_W) / 2);
    const y = Math.round((canvas.height - DIALOG_H) / 2);
    this.ui.nineSlice(this.ui.assets.panel('stone'), x, y, DIALOG_W, DIALOG_H, SCALE);

    const question = str().deleteConfirm;
    const questionW = this.ui.textWidth(question, LABEL_TEXT_SCALE);
    this.ui.text(question, x + Math.round((DIALOG_W - questionW) / 2), y + 36, LABEL_TEXT_SCALE);

    const answers: [string, string][] = [
      ['x_key', str().yes],
      ['z_key', str().no],
    ];
    let cursorX =
      x +
      Math.round(
        (DIALOG_W -
          answers.reduce(
            (w, [, label]) => w + ICON_PX + 10 + this.ui.textWidth(label, LABEL_TEXT_SCALE) + 40,
            -40,
          )) /
          2,
      );
    const rowY = y + DIALOG_H - ICON_PX - 32;
    for (const [icon, label] of answers) {
      this.ui.icon(icon, cursorX, rowY, SCALE);
      const textY = rowY + Math.round((ICON_PX - GLYPH_H * LABEL_TEXT_SCALE) / 2);
      cursorX += ICON_PX + 10 + this.ui.text(label, cursorX + ICON_PX + 10, textY, LABEL_TEXT_SCALE) + 40;
    }
  }

  pause(muted: boolean): void {
    this.ui.dim(0.6);
    const { canvas } = this.ctx;
    const x = Math.round((canvas.width - PAUSE_PANEL) / 2);
    const y = Math.round((canvas.height - PAUSE_PANEL) / 2);
    this.ui.nineSlice(this.ui.assets.panel('stone'), x, y, PAUSE_PANEL, PAUSE_PANEL, SCALE);
    const iconPx = 16 * 8;
    this.ui.icon('pause', x + (PAUSE_PANEL - iconPx) / 2, y + (PAUSE_PANEL - iconPx) / 2 - 14, 8);
    const labelW = this.ui.textWidth(str().paused, LABEL_TEXT_SCALE);
    this.ui.text(
      str().paused,
      x + Math.round((PAUSE_PANEL - labelW) / 2),
      y + PAUSE_PANEL - GLYPH_H * LABEL_TEXT_SCALE - 24,
      LABEL_TEXT_SCALE,
    );

    // Sound state under the panel: speaker icon + the key that flips it.
    const hintW = ICON_PX + 10 + this.ui.textWidth(str().pressM, LABEL_TEXT_SCALE);
    const hintX = Math.round((canvas.width - hintW) / 2);
    const hintY = y + PAUSE_PANEL + 20;
    this.ui.icon(muted ? 'speaker_off' : 'speaker_on', hintX, hintY, SCALE);
    const textY = hintY + Math.round((ICON_PX - GLYPH_H * LABEL_TEXT_SCALE) / 2);
    this.ui.text(str().pressM, hintX + ICON_PX + 10, textY, LABEL_TEXT_SCALE);
  }

  // -------------------------------------------------------------- helpers

  /** Vertical text menu with a highlight box around the selected entry. */
  private menu(entries: string[], cursor: number, top: number): void {
    const { canvas } = this.ctx;
    entries.forEach((entry, index) => {
      const w = this.ui.textWidth(entry, LABEL_TEXT_SCALE);
      const x = Math.round((canvas.width - w) / 2);
      const y = top + index * MENU_ROW_H;
      this.ui.text(entry, x, y, LABEL_TEXT_SCALE);
      if (index === cursor) {
        this.ui.highlight(
          x - 20,
          y - 12,
          w + 40,
          GLYPH_H * LABEL_TEXT_SCALE + 24,
          SCALE,
        );
      }
    });
  }

  private deleteButton(cardX: number, y: number, highlighted: boolean): void {
    const label = str().delete;
    const labelW = this.ui.textWidth(label, LABEL_TEXT_SCALE);
    const w = labelW + 48;
    const x = cardX + Math.round((CARD_W - w) / 2);
    this.ui.nineSlice(this.ui.assets.panel('stone'), x, y, w, DELETE_BUTTON_H, SCALE);
    const textY = y + Math.round((DELETE_BUTTON_H - GLYPH_H * LABEL_TEXT_SCALE) / 2);
    this.ctx.save();
    this.ctx.globalAlpha = highlighted ? 1 : 0.75;
    this.ctx.fillStyle = DELETE_COLOR;
    this.ctx.fillRect(x + 8, y + DELETE_BUTTON_H - 10, w - 16, 4);
    this.ui.text(label, x + 24, textY, LABEL_TEXT_SCALE);
    this.ctx.restore();
    if (highlighted) this.ui.highlight(x, y, w, DELETE_BUTTON_H, SCALE);
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
    this.ui.text(digit, x + Math.round((CARD_W - digitW) / 2), y + 26, SLOT_DIGIT_SCALE);

    const contentY = y + CARD_H - ICON_PX - 36;
    if (summary === null) {
      this.ui.icon('plus', x + Math.round((CARD_W - ICON_PX) / 2), contentY - 16, SCALE);
      const labelW = this.ui.textWidth(str().newGame, LABEL_TEXT_SCALE);
      this.ui.text(
        str().newGame,
        x + Math.round((CARD_W - labelW) / 2),
        contentY + ICON_PX - 6,
        LABEL_TEXT_SCALE,
      );
      return;
    }
    const text = `${summary.money}`;
    const width = ICON_PX + 8 + this.ui.textWidth(text, LABEL_TEXT_SCALE);
    const iconX = x + Math.round((CARD_W - width) / 2);
    this.ui.icon('coin', iconX, contentY, SCALE);
    const textY = contentY + Math.round((ICON_PX - GLYPH_H * LABEL_TEXT_SCALE) / 2);
    this.ui.text(text, iconX + ICON_PX + 8, textY, LABEL_TEXT_SCALE);
  }
}
