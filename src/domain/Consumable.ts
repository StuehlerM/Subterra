/**
 * A carried, restockable supply (e.g. dynamite or flares). Starts full, is used
 * one at a time, and is refilled to capacity at the base.
 */
export class Consumable {
  private count: number;

  constructor(private cap: number) {
    this.count = cap;
  }

  get capacity(): number {
    return this.cap;
  }

  get remaining(): number {
    return this.count;
  }

  get isEmpty(): boolean {
    return this.count <= 0;
  }

  /** Consumes one unit if available. Returns whether one was used. */
  tryUse(): boolean {
    if (this.count <= 0) return false;
    this.count -= 1;
    return true;
  }

  restock(): void {
    this.count = this.cap;
  }

  /** Raises capacity (e.g. after an upgrade); never overfills current count. */
  setCapacity(capacity: number): void {
    this.cap = capacity;
    if (this.count > capacity) this.count = capacity;
  }
}
