import { Game } from '../app/Game';
import { ALL_UPGRADES, UPGRADE_CATALOG, UpgradeType, maxLevel } from '../domain/upgrades';

interface UpgradeRow {
  readonly button: HTMLButtonElement;
}

/**
 * Base shop overlay. Visible only while the miner is at the surface base. Shows
 * one button per upgrade with its next-level cost; buying is delegated to the
 * game and persisted via the supplied callback.
 */
export class Shop {
  private readonly panel: HTMLDivElement;
  private readonly rows = new Map<UpgradeType, UpgradeRow>();

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
      padding: '10px 12px',
      font: '13px monospace',
      color: '#f0f0f0',
      background: 'rgba(0,0,0,0.6)',
      borderRadius: '6px',
      display: 'none',
      minWidth: '220px',
    } satisfies Partial<CSSStyleDeclaration>);

    const title = document.createElement('div');
    title.textContent = 'BASE — Upgrades';
    Object.assign(title.style, { marginBottom: '8px', fontWeight: 'bold' });
    this.panel.appendChild(title);

    for (const type of ALL_UPGRADES) this.addRow(type);
    parent.appendChild(this.panel);
  }

  update(): void {
    const atBase = this.game.isAtBase();
    this.panel.style.display = atBase ? 'block' : 'none';
    if (!atBase) return;
    for (const type of ALL_UPGRADES) this.refreshRow(type);
  }

  private addRow(type: UpgradeType): void {
    const button = document.createElement('button');
    Object.assign(button.style, {
      display: 'block',
      width: '100%',
      margin: '4px 0',
      padding: '6px 8px',
      font: '12px monospace',
      cursor: 'pointer',
    } satisfies Partial<CSSStyleDeclaration>);
    button.addEventListener('click', () => this.buy(type));
    this.panel.appendChild(button);
    this.rows.set(type, { button });
  }

  private refreshRow(type: UpgradeType): void {
    const row = this.rows.get(type);
    if (!row) return;
    const label = UPGRADE_CATALOG[type].label;
    const level = this.game.progress.level(type);
    const cost = this.game.progress.costToUpgrade(type);
    if (cost === null) {
      row.button.textContent = `${label}  Lv ${level}/${maxLevel(type)}  (MAX)`;
      row.button.disabled = true;
      return;
    }
    row.button.textContent = `${label}  Lv ${level}  →  $${cost}`;
    row.button.disabled = !this.game.progress.canBuy(type);
  }

  private buy(type: UpgradeType): void {
    if (this.game.buyUpgrade(type)) {
      this.onPurchase();
      this.refreshRow(type);
    }
  }
}
