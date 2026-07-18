import { Game } from '../app/Game';

/** Small always-on overlay showing money, cargo, battery and depth. */
export class Hud {
  private readonly root: HTMLDivElement;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    Object.assign(this.root.style, {
      position: 'fixed',
      top: '8px',
      left: '8px',
      padding: '8px 12px',
      font: '14px monospace',
      color: '#f0f0f0',
      background: 'rgba(0,0,0,0.45)',
      borderRadius: '6px',
      whiteSpace: 'pre',
      pointerEvents: 'none',
    } satisfies Partial<CSSStyleDeclaration>);
    parent.appendChild(this.root);
  }

  update(game: Game): void {
    const { cargo, battery } = game.player;
    this.root.textContent = [
      `Money:   $${game.progress.money}`,
      `Cargo:   ${cargo.count}/${cargo.capacity}  ($${cargo.totalValue})`,
      `Battery: ${battery.current}/${battery.capacity}`,
      `Depth:   ${game.depth()}`,
    ].join('\n');
  }
}
