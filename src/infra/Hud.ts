import { Game } from '../app/Game';

/**
 * Always-on overlay for young players: pictograms + numbers only, no words.
 * 🪙 money · 📦 cargo · 🔋 battery · 🧨 dynamite · 🔦 flares · ⬇️ depth.
 */
export class Hud {
  private readonly root: HTMLDivElement;

  constructor(parent: HTMLElement) {
    this.root = document.createElement('div');
    Object.assign(this.root.style, {
      position: 'fixed',
      top: '8px',
      left: '8px',
      padding: '8px 12px',
      font: '18px system-ui, sans-serif',
      color: '#f0f0f0',
      background: 'rgba(0,0,0,0.45)',
      borderRadius: '8px',
      whiteSpace: 'pre',
      lineHeight: '1.5',
      pointerEvents: 'none',
    } satisfies Partial<CSSStyleDeclaration>);
    parent.appendChild(this.root);
  }

  update(game: Game): void {
    const { cargo, battery, dynamite, flare } = game.player;
    this.root.textContent = [
      `🪙 ${game.progress.money}`,
      `📦 ${cargo.count}/${cargo.capacity}`,
      `🔋 ${battery.current}/${battery.capacity}${battery.isEmpty ? ' ⚠️' : ''}`,
      `🧨 ${dynamite.remaining}/${dynamite.capacity}`,
      `🔦 ${flare.remaining}/${flare.capacity}`,
      `⬇️ ${game.depth()}`,
    ].join('\n');
  }
}
