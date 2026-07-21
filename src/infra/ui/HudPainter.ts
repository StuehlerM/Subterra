import { Game } from '../../app/Game';
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
/** Longest count the HUD ever shows ("00000"). */
const WIDEST_TEXT = '00000';
const CARGO_BAR_COLOR = '#d8b25a';

interface HudRow {
  readonly icon: string;
  readonly text: string;
  readonly decorate?: (x: number, y: number) => void;
}

/**
 * Draws the always-on HUD as a wood panel of pictogram rows: money, cargo
 * (crate with a fill bar), battery (a real battery whose charge lowers and
 * shifts green → yellow → red), dynamite, flares and depth.
 */
export class HudPainter {
  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly ui: UiPainter,
  ) {}

  draw(game: Game): void {
    const rows = this.rows(game);
    const textWidth = this.ui.textWidth(WIDEST_TEXT, TEXT_SCALE);
    const width = PADDING * 2 + ICON_PX + ICON_TEXT_GAP + textWidth;
    const height = PADDING * 2 + rows.length * (ICON_PX + ROW_GAP) - ROW_GAP;
    this.ui.nineSlice(this.ui.assets.panel('wood'), MARGIN, MARGIN, width, height, SCALE);

    let y = MARGIN + PADDING;
    for (const row of rows) {
      const x = MARGIN + PADDING;
      row.decorate?.(x, y);
      this.ui.icon(row.icon, x, y, SCALE);
      const textY = y + (ICON_PX - 5 * TEXT_SCALE) / 2;
      this.ui.text(row.text, x + ICON_PX + ICON_TEXT_GAP, textY, TEXT_SCALE);
      y += ICON_PX + ROW_GAP;
    }
  }

  private rows(game: Game): HudRow[] {
    const { cargo, battery, dynamite, flare } = game.player;
    return [
      { icon: 'coin', text: `${game.progress.money}` },
      {
        icon: 'crate',
        text: `${cargo.count}/${cargo.capacity}`,
        decorate: (x, y) => this.cargoBar(x, y, cargo.count / cargo.capacity),
      },
      {
        icon: battery.isEmpty ? 'warning' : 'battery',
        text: `${battery.current}/${battery.capacity}`,
        decorate: battery.isEmpty ? undefined : (x, y) => this.batteryFill(x, y, battery.current, battery.capacity),
      },
      { icon: 'dynamite', text: `${dynamite.remaining}/${dynamite.capacity}` },
      { icon: 'flare', text: `${flare.remaining}/${flare.capacity}` },
      { icon: 'depth', text: `${game.depth()}` },
    ];
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
    this.ctx.fillStyle = CARGO_BAR_COLOR;
    this.ctx.fillRect(iconX, iconY + ICON_PX - SCALE, Math.round(ICON_PX * fraction), SCALE);
  }
}
