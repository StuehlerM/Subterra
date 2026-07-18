/**
 * The miner's ore hold. Tracks how many ore pieces are carried (capped by
 * capacity) and their combined money value. Selling clears it.
 */
export class Cargo {
  private itemCount = 0;
  private value = 0;

  constructor(private cap: number) {}

  get capacity(): number {
    return this.cap;
  }

  get count(): number {
    return this.itemCount;
  }

  get totalValue(): number {
    return this.value;
  }

  get isFull(): boolean {
    return this.itemCount >= this.cap;
  }

  get isEmpty(): boolean {
    return this.itemCount === 0;
  }

  /** Adds one ore of the given value. Returns false if the hold is full. */
  add(oreValue: number): boolean {
    if (this.isFull) return false;
    this.itemCount += 1;
    this.value += oreValue;
    return true;
  }

  clear(): void {
    this.itemCount = 0;
    this.value = 0;
  }

  /** Raises the capacity (e.g. after an upgrade); never drops carried ore. */
  setCapacity(capacity: number): void {
    this.cap = capacity;
  }
}
