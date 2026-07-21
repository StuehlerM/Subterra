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
const CONFIRM_KEY = 'KeyX';
const PAUSE_KEY = 'Escape';
const MUTE_KEY = 'KeyM';
const MAX_NAV_QUEUE = 8;

/**
 * Translates keyboard state into intents. Movement is level-triggered (held key
 * wins, most-recent first); the two action keys are edge-triggered and consumed
 * once per press. At the base these action keys drive the shop instead.
 */
export class InputController {
  private readonly held: string[] = [];
  private readonly navQueue: Direction[] = [];
  private dynamitePressed = false;
  private confirmPressed = false;
  private pausePressed = false;
  private mutePressed = false;

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

  /** Next edge-triggered direction press (for menu navigation), or null. */
  consumeNav(): Direction | null {
    return this.navQueue.shift() ?? null;
  }

  consumeDynamite(): boolean {
    const pressed = this.dynamitePressed;
    this.dynamitePressed = false;
    return pressed;
  }

  /** The universal confirm key (X). Also used as the flare key in gameplay. */
  consumeConfirm(): boolean {
    const pressed = this.confirmPressed;
    this.confirmPressed = false;
    return pressed;
  }

  /** Esc: the meta pause key (not part of the 6 gameplay keys). */
  consumePause(): boolean {
    const pressed = this.pausePressed;
    this.pausePressed = false;
    return pressed;
  }

  /** M: the classic mute toggle (also a meta key). */
  consumeMute(): boolean {
    const pressed = this.mutePressed;
    this.mutePressed = false;
    return pressed;
  }

  private onKeyDown(event: KeyboardEvent): void {
    const direction = KEY_DIRECTIONS[event.code];
    if (direction) {
      event.preventDefault();
      if (!this.held.includes(event.code)) this.held.push(event.code);
      if (!event.repeat && this.navQueue.length < MAX_NAV_QUEUE) this.navQueue.push(direction);
      return;
    }
    if (event.repeat) return;
    if (event.code === DYNAMITE_KEY) {
      event.preventDefault();
      this.dynamitePressed = true;
    } else if (event.code === CONFIRM_KEY) {
      event.preventDefault();
      this.confirmPressed = true;
    } else if (event.code === PAUSE_KEY) {
      event.preventDefault();
      this.pausePressed = true;
    } else if (event.code === MUTE_KEY) {
      event.preventDefault();
      this.mutePressed = true;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    const index = this.held.indexOf(event.code);
    if (index !== -1) this.held.splice(index, 1);
  }
}
