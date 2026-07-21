import { Game } from '../../app/Game';
import { str } from '../../app/strings';
import { CargoEntry } from '../../domain/Cargo';
import { AssetRegistry } from '../AssetRegistry';
import { BATTERY_SEGMENTS } from '../sprites/art/ui';
import { frameIndexAt } from '../sprites/animation';
import { filledUnits, gaugeColor } from './gauge';
import { UiPainter } from './UiPainter';

const SCALE = 4;
const ICON_ART = 16;
const ICON_PX = ICON_ART * SCALE;
const MARGIN = 10;
const PADDING = 14;
const ROW_GAP = 8;
const ICON_TEXT_GAP = 10;
const TEXT_SCALE = 4;
const GLYPH_H = 5;
/** Mini ore chips in the cargo contents row. */
const CHIP_PX = 24;
const CHIP_GAP = 10;
const CHIP_TEXT_SCALE = 2;
/** The last battery segment blinks red at this rate. */
const BLINK_MS = 300;
const BLINK_RED = '#e04a3a';
const BATTERY_ART_W = 26;
/** Segments left at which the battery starts blinking red. */
const BLINK_AT_SEGMENTS = 1;
/** The controls legend is drawn smaller so it stays unobtrusive. */
const LEGEND_SCALE = 3;
const LEGEND_ICON_PX = ICON_ART * LEGEND_SCALE;
const LEGEND_TEXT_SCALE = 2;
const LEGEND_GAP = 6;
const LEGEND_ROW_GAP = 6;

interface HudRow {
  readonly icon: string;
  readonly text: string;
  /** Art-pixel width of the icon (the wide battery is 26, others 16). */
  readonly iconArtWidth?: number;
  readonly decorate?: (x: number, y: number) => void;
}

/**
 * The always-on HUD, spread over the screen corners: the big segmented
 * battery + depth top-left, the money pouch top-right, and the cargo hold
 * (with what's inside) plus dynamite/flare counts bottom-right. The battery
 * loses discrete segments and blinks red on the last one.
 */
export class HudPainter {
  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly ui: UiPainter,
    private readonly world: AssetRegistry,
  ) {}

  draw(game: Game): void {
    const { canvas } = this.ctx;
    const { battery, dynamite, flare } = game.player;

    this.panel(MARGIN, MARGIN, [
      {
        icon: 'battery_wide',
        iconArtWidth: BATTERY_ART_W,
        text: `${battery.current}/${battery.capacity}`,
        decorate: (x, y) => this.batterySegments(x, y, battery.current, battery.capacity),
      },
      { icon: 'depth', text: `${game.depth()}` },
    ]);

    const coinRows: HudRow[] = [{ icon: 'coin', text: `${game.progress.money}` }];
    const coinW = this.panelWidth(coinRows);
    this.panel(canvas.width - MARGIN - coinW, MARGIN, coinRows);

    this.bottomRight(game, dynamite.remaining, dynamite.capacity, flare.remaining, flare.capacity);
    if (!game.isMenuOpen()) this.controlsLegend();
  }

  /** Bottom-left: which key does what (arrows, Z, X). */
  private controlsLegend(): void {
    const { canvas } = this.ctx;
    const rows: [string, string][] = [
      ['arrows', str().ctrlMove],
      ['z_key', str().ctrlDynamite],
      ['x_key', str().ctrlFlare],
    ];
    const height = rows.length * (LEGEND_ICON_PX + LEGEND_ROW_GAP) - LEGEND_ROW_GAP;
    let y = canvas.height - MARGIN - height;
    for (const [icon, label] of rows) {
      this.ui.icon(icon, MARGIN, y, LEGEND_SCALE);
      const textY = y + Math.round((LEGEND_ICON_PX - GLYPH_H * LEGEND_TEXT_SCALE) / 2);
      this.ui.text(label, MARGIN + LEGEND_ICON_PX + LEGEND_GAP, textY, LEGEND_TEXT_SCALE);
      y += LEGEND_ICON_PX + LEGEND_ROW_GAP;
    }
  }

  // ------------------------------------------------------------- battery

  /** Discrete charge blocks behind the transparent shell interior. */
  private batterySegments(iconX: number, iconY: number, current: number, capacity: number): void {
    const { x, y, w, h, gap, count } = BATTERY_SEGMENTS;
    const units = filledUnits(current, capacity, count);
    const critical = units <= BLINK_AT_SEGMENTS;
    const blinkOn = frameIndexAt(performance.now(), 2, BLINK_MS) === 0;
    if (critical && !blinkOn) return; // blink: skip every other phase

    this.ctx.fillStyle = critical ? BLINK_RED : gaugeColor(current / capacity);
    const shown = units === 0 ? count : units; // empty: flash the whole shell
    const alpha = units === 0 ? 0.45 : 1;
    this.ctx.save();
    this.ctx.globalAlpha = alpha;
    for (let i = 0; i < shown; i++) {
      this.ctx.fillRect(
        iconX + (x + i * (w + gap)) * SCALE,
        iconY + y * SCALE,
        w * SCALE,
        h * SCALE,
      );
    }
    this.ctx.restore();
  }

  // ---------------------------------------------------------- bottom right

  private bottomRight(
    game: Game,
    dynamite: number,
    dynamiteCap: number,
    flares: number,
    flareCap: number,
  ): void {
    const { canvas } = this.ctx;
    const { cargo } = game.player;

    const cargoRows: HudRow[] = [
      {
        icon: 'crate',
        text: `${cargo.count}/${cargo.capacity}`,
        decorate: (x, y) => this.cargoBar(x, y, cargo.count / cargo.capacity),
      },
    ];
    const contents = cargo.contents;
    const contentsW = this.contentsWidth(contents);
    const cargoW = Math.max(this.panelWidth(cargoRows), contentsW + PADDING * 2);
    const contentsH = contents.length > 0 ? CHIP_PX + ROW_GAP : 0;
    const cargoH = PADDING * 2 + ICON_PX + contentsH;
    const cargoX = canvas.width - MARGIN - cargoW;
    const cargoY = canvas.height - MARGIN - cargoH;
    this.ui.nineSlice(this.ui.assets.panel('wood'), cargoX, cargoY, cargoW, cargoH, SCALE);
    this.rowsAt(cargoX, cargoY, cargoRows);
    if (contents.length > 0) {
      this.contentsRow(contents, cargoX + PADDING, cargoY + PADDING + ICON_PX + ROW_GAP);
    }

    const supplyRows: HudRow[] = [
      { icon: 'dynamite', text: `${dynamite}/${dynamiteCap}` },
      { icon: 'flare', text: `${flares}/${flareCap}` },
    ];
    const supplyW = this.panelWidth(supplyRows);
    const supplyH = this.panelHeight(supplyRows);
    this.panel(cargoX - MARGIN - supplyW, canvas.height - MARGIN - supplyH, supplyRows);
  }

  /** Mini ore chips with counts: what the hold actually carries. */
  private contentsRow(contents: readonly CargoEntry[], x: number, y: number): void {
    let cursor = x;
    for (const entry of contents) {
      const sprite = this.world.tile(entry.type);
      if (sprite) this.ctx.drawImage(sprite.frame(0), cursor, y, CHIP_PX, CHIP_PX);
      cursor += CHIP_PX + 3;
      const text = `${entry.count}`;
      const textY = y + CHIP_PX - GLYPH_H * CHIP_TEXT_SCALE;
      cursor += this.ui.text(text, cursor, textY, CHIP_TEXT_SCALE) + CHIP_GAP;
    }
  }

  private contentsWidth(contents: readonly CargoEntry[]): number {
    let width = 0;
    for (const entry of contents) {
      width += CHIP_PX + 3 + this.ui.textWidth(`${entry.count}`, CHIP_TEXT_SCALE) + CHIP_GAP;
    }
    return Math.max(0, width - CHIP_GAP);
  }

  // ------------------------------------------------------------- plumbing

  private panel(x: number, y: number, rows: HudRow[]): void {
    this.ui.nineSlice(this.ui.assets.panel('wood'), x, y, this.panelWidth(rows), this.panelHeight(rows), SCALE);
    this.rowsAt(x, y, rows);
  }

  private rowsAt(panelX: number, panelY: number, rows: HudRow[]): void {
    let y = panelY + PADDING;
    for (const row of rows) {
      const x = panelX + PADDING;
      // Center icons of any height (the wide battery is 26x12) in the row.
      const sprite = this.ui.assets.icon(row.icon);
      const iconY = y + Math.round((ICON_PX - sprite.height * SCALE) / 2);
      row.decorate?.(x, iconY);
      this.ui.icon(row.icon, x, iconY, SCALE);
      const iconW = (row.iconArtWidth ?? ICON_ART) * SCALE;
      const textY = y + (ICON_PX - GLYPH_H * TEXT_SCALE) / 2;
      this.ui.text(row.text, x + iconW + ICON_TEXT_GAP, textY, TEXT_SCALE);
      y += ICON_PX + ROW_GAP;
    }
  }

  private panelWidth(rows: HudRow[]): number {
    const rowW = (row: HudRow) =>
      (row.iconArtWidth ?? ICON_ART) * SCALE + ICON_TEXT_GAP + this.ui.textWidth(row.text, TEXT_SCALE);
    return PADDING * 2 + Math.max(...rows.map(rowW));
  }

  private panelHeight(rows: HudRow[]): number {
    return PADDING * 2 + rows.length * (ICON_PX + ROW_GAP) - ROW_GAP;
  }

  /** A thin bar under the crate showing how full the cargo hold is. */
  private cargoBar(iconX: number, iconY: number, fraction: number): void {
    this.ctx.fillStyle = '#d8b25a';
    this.ctx.fillRect(iconX, iconY + ICON_PX - SCALE, Math.round(ICON_PX * fraction), SCALE);
  }
}
