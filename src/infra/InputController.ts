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

const DYNAMITE_KEY = 'KeyZ';
const FLARE_KEY = 'KeyX';

/**
 * Translates keyboard state into intents. Movement is level-triggered (held key
 * wins, most-recent first); the two action keys are edge-triggered and consumed
 * once per press. At the base these action keys drive the shop instead.
 */
export class InputController {
  private readonly held: string[] = [];
  private dynamitePressed = false;
  private flarePressed = false;

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

  consumeDynamite(): boolean {
    const pressed = this.dynamitePressed;
    this.dynamitePressed = false;
    return pressed;
  }

  consumeFlare(): boolean {
    const pressed = this.flarePressed;
    this.flarePressed = false;
    return pressed;
  }

  private onKeyDown(event: KeyboardEvent): void {
    if (KEY_DIRECTIONS[event.code]) {
      event.preventDefault();
      if (!this.held.includes(event.code)) this.held.push(event.code);
      return;
    }
    if (event.repeat) return;
    if (event.code === DYNAMITE_KEY) {
      event.preventDefault();
      this.dynamitePressed = true;
    } else if (event.code === FLARE_KEY) {
      event.preventDefault();
      this.flarePressed = true;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    const index = this.held.indexOf(event.code);
    if (index !== -1) this.held.splice(index, 1);
  }
}
