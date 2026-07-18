import { DOWN, Direction, LEFT, RIGHT, UP } from '../domain/Direction';

const KEY_DIRECTIONS: Record<string, Direction> = {
  ArrowUp: UP,
  KeyW: UP,
  ArrowDown: DOWN,
  KeyS: DOWN,
  ArrowLeft: LEFT,
  KeyA: LEFT,
  ArrowRight: RIGHT,
  KeyD: RIGHT,
};

/**
 * Translates keyboard state into a movement direction. Tracks held keys so that
 * the most recently pressed direction wins (natural for grid movement). Only
 * the four movement keys are handled in Phase 0; dynamite/flare come later.
 */
export class InputController {
  private readonly held: string[] = [];

  attach(target: Window): void {
    target.addEventListener('keydown', (event) => this.onKeyDown(event));
    target.addEventListener('keyup', (event) => this.onKeyUp(event));
  }

  currentDirection(): Direction | null {
    for (let i = this.held.length - 1; i >= 0; i--) {
      const direction = KEY_DIRECTIONS[this.held[i]];
      if (direction) return direction;
    }
    return null;
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (!KEY_DIRECTIONS[event.code]) return;
    event.preventDefault();
    if (!this.held.includes(event.code)) this.held.push(event.code);
  }

  private onKeyUp(event: KeyboardEvent): void {
    const index = this.held.indexOf(event.code);
    if (index !== -1) this.held.splice(index, 1);
  }
}
