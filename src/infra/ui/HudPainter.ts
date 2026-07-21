import { Game } from '../../app/Game';
import { CargoEntry } from '../../domain/Cargo';
import { AssetRegistry } from '../AssetRegistry';
import { BATTERY_INTERIOR } from '../sprites/art/ui';
import { filledUnits, gaugeColor } from './gauge';
import { UiPainter } from './UiPainter';

const SCALE = 2;
const ICON_PX = 16 * SCALE;
const MARGIN = 8;
const PADDING = 10;
const ROW_GAP = 4;
const ICON_TEXT_GAP = 6;
const TEXT_SCALE = 2;
const GLYPH_H = 5;
/** Mini ore chips in the cargo contents row. */
const CHIP_PX = 16;
const CHIP_GAP = 6;
const CHIP_TEXT_SCALE = 1;

interface HudRow {
  readonly icon: string;
  readonly text: string;
  readonly decorate?: (x: number, y: number) => void;
}

/**
 * The always-on HUD, spread over the screen corners: battery + depth top-left,
 * the money pouch top-right, and the cargo hold (with what's inside) plus
 * dynamite/flare counts bottom-right. The battery is a real battery whose
 * charge lowers and shifts green → yellow → red.
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
        icon: battery.isEmpty ? 'warning' : 'battery',
        text: `${battery.current}/${battery.capacity}`,
        decorate: battery.isEmpty
          ? undefined
          : (x, y) => this.batteryFill(x, y, battery.current, battery.capacity),
      },
      { icon: 'depth', text: `${game.depth()}` },
    ]);

    const coinRows: HudRow[] = [{ icon: 'coin', text: `${game.progress.money}` }];
    const coinW = this.panelWidth(coinRows);
    this.panel(canvas.width - MARGIN - coinW, MARGIN, coinRows);

    this.bottomRight(game, dynamite.remaining, dynamite.capacity, flare.remaining, flare.capacity);
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
      cursor += CHIP_PX + 2;
      const text = `${entry.count}`;
      const textY = y + CHIP_PX - GLYPH_H * CHIP_TEXT_SCALE;
      cursor += this.ui.text(text, cursor, textY, CHIP_TEXT_SCALE) + CHIP_GAP;
    }
  }

  private contentsWidth(contents: readonly CargoEntry[]): number {
    let width = 0;
    for (const entry of contents) {
      width += CHIP_PX + 2 + this.ui.textWidth(`${entry.count}`, CHIP_TEXT_SCALE) + CHIP_GAP;
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
      row.decorate?.(x, y);
      this.ui.icon(row.icon, x, y, SCALE);
      const textY = y + (ICON_PX - GLYPH_H * TEXT_SCALE) / 2;
      this.ui.text(row.text, x + ICON_PX + ICON_TEXT_GAP, textY, TEXT_SCALE);
      y += ICON_PX + ROW_GAP;
    }
  }

  private panelWidth(rows: HudRow[]): number {
    const textW = Math.max(...rows.map((r) => this.ui.textWidth(r.text, TEXT_SCALE)));
    return PADDING * 2 + ICON_PX + ICON_TEXT_GAP + textW;
  }

  private panelHeight(rows: HudRow[]): number {
    return PADDING * 2 + rows.length * (ICON_PX + ROW_GAP) - ROW_GAP;
  }

  /** Paints the charge behind the battery shell's hollow interior. */
  private batteryFill(iconX: number, iconY: number, current: number, capacity: number): void {
    const units = filledUnits(current, capacity, BATTERY_INTERIOR.w);
    if (units === 0) return;
    this.ctx.fillStyle = gaugeColor(current / capacity);
    this.ctx.fillRect(
      iconX + BATTERY_INTERIOR.x * SCALE,
      iconY + BATTERY_INTERIOR.y * SCALE,
      units * SCALE,
      BATTERY_INTERIOR.h * SCALE,
    );
  }

  /** A thin bar under the crate showing how full the cargo hold is. */
  private cargoBar(iconX: number, iconY: number, fraction: number): void {
    this.ctx.fillStyle = '#d8b25a';
    this.ctx.fillRect(iconX, iconY + ICON_PX - SCALE, Math.round(ICON_PX * fraction), SCALE);
  }
}
