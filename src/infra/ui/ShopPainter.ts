import { Game } from '../../app/Game';
import { ShopMenu } from '../../app/ShopMenu';
import { STRINGS, UPGRADE_NAMES } from '../../app/strings';
import { UpgradeType, maxLevel } from '../../domain/upgrades';
import { UiPainter } from './UiPainter';

const SCALE = 2;
const ICON_PX = 16 * SCALE;
const CELL_W = 56;
const CELL_H = 78;
const CELL_GAP = 8;
const PANEL_PADDING = 16;
const BUTTON_H = 44;
const BUTTON_GAP = 12;
const BUTTON_PADDING = 14;
const BUTTON_ICON_GAP = 8;
const NAME_ROW_H = 20;
const NAME_TEXT_SCALE = 2;
const GLYPH_H = 5;
const PIP = 6;
const PIP_GAP = 3;
const DIM_ALPHA = 0.55;
const UNAFFORDABLE_ALPHA = 0.4;
const PIP_ON = '#ffe36e';
const PIP_OFF = '#3a2c1a';
const COST_TEXT_SCALE = 1;

/** Which UI icon shows each upgrade (no words, for young players). */
const UPGRADE_ICON: Record<UpgradeType, string> = {
  [UpgradeType.DrillStrength]: 'pickaxe',
  [UpgradeType.DrillSpeed]: 'lightning',
  [UpgradeType.CargoCapacity]: 'crate',
  [UpgradeType.BatteryCapacity]: 'battery',
  [UpgradeType.DynamiteCapacity]: 'dynamite',
  [UpgradeType.BlastRadius]: 'blast',
  [UpgradeType.FlareCapacity]: 'flare',
};

/**
 * The surface shop as a wood panel over the scene: one cell per upgrade
 * (icon, level pips, coin cost or star when maxed) and a "drill again"
 * button below. The highlight follows the ShopMenu model.
 */
export class ShopPainter {
  constructor(
    private readonly ctx: CanvasRenderingContext2D,
    private readonly ui: UiPainter,
  ) {}

  draw(game: Game, menu: ShopMenu): void {
    const { canvas } = this.ctx;
    this.ui.dim(DIM_ALPHA);

    const rowWidth = menu.types.length * CELL_W + (menu.types.length - 1) * CELL_GAP;
    const panelW = rowWidth + PANEL_PADDING * 2;
    const panelH = PANEL_PADDING * 2 + CELL_H + NAME_ROW_H + BUTTON_GAP + BUTTON_H;
    const panelX = Math.round((canvas.width - panelW) / 2);
    const panelY = Math.round((canvas.height - panelH) / 2);
    this.ui.nineSlice(this.ui.assets.panel('wood'), panelX, panelY, panelW, panelH, SCALE);

    menu.types.forEach((type, index) => {
      const x = panelX + PANEL_PADDING + index * (CELL_W + CELL_GAP);
      const y = panelY + PANEL_PADDING;
      this.drawCell(game, type, x, y, index === menu.selectedIndex && !menu.onDrillAgain);
    });

    // The highlighted upgrade's name, centred under the row.
    if (!menu.onDrillAgain) {
      const name = UPGRADE_NAMES[menu.types[menu.selectedIndex]];
      const nameW = this.ui.textWidth(name, NAME_TEXT_SCALE);
      this.ui.text(name, panelX + Math.round((panelW - nameW) / 2), panelY + PANEL_PADDING + CELL_H + 4, NAME_TEXT_SCALE);
    }

    const label = STRINGS.drillAgain;
    const labelW = this.ui.textWidth(label, NAME_TEXT_SCALE);
    const buttonW = BUTTON_PADDING * 2 + ICON_PX + BUTTON_ICON_GAP + labelW;
    const buttonX = panelX + Math.round((panelW - buttonW) / 2);
    const buttonY = panelY + PANEL_PADDING + CELL_H + NAME_ROW_H + BUTTON_GAP;
    this.ui.nineSlice(this.ui.assets.panel('stone'), buttonX, buttonY, buttonW, BUTTON_H, SCALE);
    this.ui.icon('drill_down', buttonX + BUTTON_PADDING, buttonY + (BUTTON_H - ICON_PX) / 2, SCALE);
    this.ui.text(
      label,
      buttonX + BUTTON_PADDING + ICON_PX + BUTTON_ICON_GAP,
      buttonY + Math.round((BUTTON_H - GLYPH_H * NAME_TEXT_SCALE) / 2),
      NAME_TEXT_SCALE,
    );
    if (menu.onDrillAgain) this.ui.highlight(buttonX, buttonY, buttonW, BUTTON_H, SCALE);
  }

  private drawCell(game: Game, type: UpgradeType, x: number, y: number, selected: boolean): void {
    const cost = game.progress.costToUpgrade(type);
    const affordable = game.progress.canBuy(type);

    this.ctx.save();
    if (cost !== null && !affordable) this.ctx.globalAlpha = UNAFFORDABLE_ALPHA;
    this.ui.icon(UPGRADE_ICON[type], x + (CELL_W - ICON_PX) / 2, y + 4, SCALE);
    this.drawPips(type, game.progress.level(type), x, y + ICON_PX + 10);
    this.drawCost(cost, x, y + ICON_PX + 10 + PIP + 8);
    this.ctx.restore();

    if (selected) this.ui.highlight(x - 2, y - 2, CELL_W + 4, CELL_H + 4, SCALE);
  }

  private drawPips(type: UpgradeType, level: number, cellX: number, y: number): void {
    const top = maxLevel(type);
    const width = top * PIP + (top - 1) * PIP_GAP;
    let x = cellX + Math.round((CELL_W - width) / 2);
    for (let i = 0; i < top; i++) {
      this.ctx.fillStyle = i < level ? PIP_ON : PIP_OFF;
      this.ctx.fillRect(x, y, PIP, PIP);
      x += PIP + PIP_GAP;
    }
  }

  private drawCost(cost: number | null, cellX: number, y: number): void {
    if (cost === null) {
      this.ui.icon('star', cellX + Math.round((CELL_W - ICON_PX) / 2), y - 6, SCALE);
      return;
    }
    const text = `${cost}`;
    const coinPx = 16;
    const width = coinPx + 3 + this.ui.textWidth(text, COST_TEXT_SCALE);
    const x = cellX + Math.round((CELL_W - width) / 2);
    this.ui.icon('coin', x, y - 5, 1);
    this.ui.text(text, x + coinPx + 3, y, COST_TEXT_SCALE);
  }
}
