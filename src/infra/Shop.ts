import { Game } from '../app/Game';
import { ALL_UPGRADES, UpgradeType, maxLevel } from '../domain/upgrades';

/** Pictogram per upgrade (no words, for young players). */
const UPGRADE_ICON: Record<UpgradeType, string> = {
  [UpgradeType.DrillStrength]: '⛏️',
  [UpgradeType.DrillSpeed]: '⚡',
  [UpgradeType.CargoCapacity]: '📦',
  [UpgradeType.BatteryCapacity]: '🔋',
  [UpgradeType.DynamiteCapacity]: '🧨',
};

const FILLED_PIP = '●';
const EMPTY_PIP = '○';

interface Cell {
  readonly wrap: HTMLDivElement;
  readonly pips: HTMLDivElement;
  readonly cost: HTMLDivElement;
}

/**
 * Base shop overlay, keyboard-driven and word-free. Shown only at the surface
 * base. Z cycles the highlighted upgrade; X buys it. Cost is shown as 🪙 + a
 * number; level as filled/empty pips; affordability by brightness.
 */
export class Shop {
  private readonly panel: HTMLDivElement;
  private readonly cells: Cell[] = [];
  private readonly types = ALL_UPGRADES;
  private selected = 0;

  constructor(
    parent: HTMLElement,
    private readonly game: Game,
    private readonly onPurchase: () => void,
  ) {
    this.panel = document.createElement('div');
    Object.assign(this.panel.style, {
      position: 'fixed',
      top: '8px',
      right: '8px',
      padding: '10px',
      display: 'none',
      gap: '8px',
      background: 'rgba(0,0,0,0.6)',
      borderRadius: '10px',
      font: '15px system-ui, sans-serif',
      color: '#fff',
    } satisfies Partial<CSSStyleDeclaration>);
    Object.assign(this.panel.style, { display: 'none' });
    this.panel.style.gridTemplateColumns = `repeat(${this.types.length}, 1fr)`;

    for (const type of this.types) this.addCell(type);
    parent.appendChild(this.panel);
  }

  /** Moves the highlight to the next upgrade (wraps around). */
  cycle(): void {
    this.selected = (this.selected + 1) % this.types.length;
  }

  /** Buys the highlighted upgrade if possible. */
  buySelected(): void {
    if (this.game.buyUpgrade(this.types[this.selected])) this.onPurchase();
  }

  update(): void {
    const atBase = this.game.isAtBase();
    this.panel.style.display = atBase ? 'grid' : 'none';
    if (!atBase) return;
    this.types.forEach((type, index) => this.refreshCell(type, index));
  }

  private addCell(type: UpgradeType): void {
    const wrap = document.createElement('div');
    Object.assign(wrap.style, {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: '4px',
      padding: '8px 10px',
      borderRadius: '8px',
      border: '2px solid transparent',
      minWidth: '56px',
    } satisfies Partial<CSSStyleDeclaration>);

    const icon = document.createElement('div');
    icon.textContent = UPGRADE_ICON[type];
    icon.style.fontSize = '28px';

    const pips = document.createElement('div');
    pips.style.letterSpacing = '2px';
    pips.style.fontSize = '12px';

    const cost = document.createElement('div');
    cost.style.fontSize = '14px';

    wrap.append(icon, pips, cost);
    this.panel.appendChild(wrap);
    this.cells.push({ wrap, pips, cost });
  }

  private refreshCell(type: UpgradeType, index: number): void {
    const cell = this.cells[index];
    const level = this.game.progress.level(type);
    const top = maxLevel(type);
    cell.pips.textContent = FILLED_PIP.repeat(level) + EMPTY_PIP.repeat(top - level);

    const cost = this.game.progress.costToUpgrade(type);
    const isSelected = index === this.selected;
    cell.wrap.style.borderColor = isSelected ? '#ffe36e' : 'transparent';
    cell.wrap.style.background = isSelected ? 'rgba(255,255,255,0.12)' : 'transparent';

    if (cost === null) {
      cell.cost.textContent = '⭐';
      cell.wrap.style.opacity = '0.6';
      return;
    }
    cell.cost.textContent = `🪙${cost}`;
    cell.wrap.style.opacity = this.game.progress.canBuy(type) ? '1' : '0.45';
  }
}
