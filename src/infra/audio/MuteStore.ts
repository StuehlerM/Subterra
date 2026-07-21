const MUTED_VALUE = '1';

/** Remembers the mute switch across reloads (classic M-key behaviour). */
export class MuteStore {
  private state: boolean;

  constructor(
    private readonly key: string,
    private readonly storage: Storage,
  ) {
    this.state = this.storage.getItem(this.key) === MUTED_VALUE;
  }

  get muted(): boolean {
    return this.state;
  }

  /** Flips and persists the switch; returns the new state. */
  toggle(): boolean {
    this.state = !this.state;
    if (this.state) this.storage.setItem(this.key, MUTED_VALUE);
    else this.storage.removeItem(this.key);
    return this.state;
  }
}
