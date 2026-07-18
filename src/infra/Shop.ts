import { Game } from '../app/Game';
import { Direction } from '../domain/Direction';
import { ALL_UPGRADES, UpgradeType, maxLevel } from '../domain/upgrades';

/** Pictogram per upgrade (no words, for young players). */
const UPGRADE_ICON: Record<UpgradeType, string> = {
  [UpgradeType.DrillStrength]: '⛏️',
  [UpgradeType.DrillSpeed]: '⚡',
  [UpgradeType.CargoCapacity]: '📦',
  [UpgradeType.BatteryCapacity]: '🔋',
  [UpgradeType.DynamiteCapacity]: '🧨',
};

const DRILL_AGAIN_ICON = '⛏️⬇️';
const FILLED_PIP = '●';
const EMPTY_PIP = '○';
const HIGHLIGHT = '#ffe36e';

interface Cell {
  readonly wrap: HTMLDivElement;
  readonly pips: HTMLDivElement;
  readonly cost: HTMLDivElement;
}

/**
 * Surface menu, keyboard-driven and word-free. Opens when the game reports the
 * menu is open (on surface arrival) and freezes the miner. Left/Right pick an
 * upgrade; Down selects the "Drill again" button, Up returns to the row; X
 * confirms (buy the upgrade, or leave via "Drill again"). Z closes the menu
 * outright (a quick "drill again"), handled by the caller.
 */
export class Shop {
  private readonly overlay: HTMLDivElement;
  private readonly cells: Cell[] = [];
  private readonly drillAgain: HTMLDivElement;
  private readonly types = ALL_UPGRADES;
  private selected = 0;
  private onDrillAgain = false;
  private wasOpen = false;

  constructor(
    parent: HTMLElement,
    private readonly game: Game,
    private readonly onPurchase: () => void,
  ) {
    this.overlay = document.createElement('div');
    Object.assign(this.overlay.style, {
      position: 'fixed',
      inset: '0',
      display: 'none',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '16px',
      background: 'rgba(0,0,0,0.55)',
      font: '15px system-ui, sans-serif',
      color: '#fff',
    } satisfies Partial<CSSStyleDeclaration>);

    const row = document.createElement('div');
    Object.assign(row.style, { display: 'flex', gap: '10px' } satisfies Partial<CSSStyleDeclaration>);
    for (const type of this.types) this.addCell(type, row);

    this.drillAgain = document.createElement('div');
    Object.assign(this.drillAgain.style, {
      fontSize: '30px',
      padding: '8px 16px',
      borderRadius: '10px',
      border: `3px solid transparent`,
      background: 'rgba(255,255,255,0.08)',
    } satisfies Partial<CSSStyleDeclaration>);
    this.drillAgain.textContent = DRILL_AGAIN_ICON;

    const panel = document.createElement('div');
    Object.assign(panel.style, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      gap: '14px',
      padding: '20px',
      borderRadius: '14px',
      background: 'rgba(0,0,0,0.5)',
    } satisfies Partial<CSSStyleDeclaration>);
    panel.append(row, this.drillAgain);
    this.overlay.appendChild(panel);
    parent.appendChild(this.overlay);
  }

  /** Moves the highlight in response to an edge-triggered direction press. */
  navigate(direction: Direction): void {
    if (direction.dy > 0) {
      this.onDrillAgain = true;
    } else if (direction.dy < 0) {
      this.onDrillAgain = false;
    } else if (!this.onDrillAgain) {
      const next = this.selected + direction.dx;
      this.selected = Math.max(0, Math.min(this.types.length - 1, next));
    }
  }

  /** Confirms the highlighted item (X): buy, or leave via "Drill again". */
  confirm(): void {
    if (this.onDrillAgain) {
      this.game.closeMenu();
      return;
    }
    if (this.game.buyUpgrade(this.types[this.selected])) this.onPurchase();
  }

  update(): void {
    const open = this.game.isMenuOpen();
    this.overlay.style.display = open ? 'flex' : 'none';
    if (open && !this.wasOpen) {
      this.selected = 0;
      this.onDrillAgain = false;
    }
    this.wasOpen = open;
    if (!open) return;
    this.types.forEach((type, index) => this.refreshCell(type, index));
    this.drillAgain.style.borderColor = this.onDrillAgain ? HIGHLIGHT : 'transparent';
  }

  private addCell(type: UpgradeType, row: HTMLElement): void {
    const wrap = document.createElement('div');
    Object.assign(wrap.style, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      padding: '10px 12px',
      borderRadius: '10px',
      border: '3px solid transparent',
      minWidth: '64px',
    } satisfies Partial<CSSStyleDeclaration>);

    const icon = document.createElement('div');
    icon.textContent = UPGRADE_ICON[type];
    icon.style.fontSize = '32px';

    const pips = document.createElement('div');
    pips.style.letterSpacing = '2px';
    pips.style.fontSize = '13px';

    const cost = document.createElement('div');
    cost.style.fontSize = '15px';

    wrap.append(icon, pips, cost);
    row.appendChild(wrap);
    this.cells.push({ wrap, pips, cost });
  }

  private refreshCell(type: UpgradeType, index: number): void {
    const cell = this.cells[index];
    const level = this.game.progress.level(type);
    const top = maxLevel(type);
    cell.pips.textContent = FILLED_PIP.repeat(level) + EMPTY_PIP.repeat(top - level);

    const isSelected = index === this.selected && !this.onDrillAgain;
    cell.wrap.style.borderColor = isSelected ? HIGHLIGHT : 'transparent';
    cell.wrap.style.background = isSelected ? 'rgba(255,255,255,0.12)' : 'transparent';

    const cost = this.game.progress.costToUpgrade(type);
    if (cost === null) {
      cell.cost.textContent = '⭐';
      cell.wrap.style.opacity = '0.6';
      return;
    }
    cell.cost.textContent = `🪙${cost}`;
    cell.wrap.style.opacity = this.game.progress.canBuy(type) ? '1' : '0.45';
  }
}
