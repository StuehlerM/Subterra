import { TileType } from './tiles';

export interface CargoEntry {
  readonly type: TileType;
  readonly count: number;
}

/**
 * The miner's ore hold. Tracks how many ore pieces are carried (capped by
 * capacity), what kinds they are, and their combined money value. Selling
 * clears it.
 */
export class Cargo {
  private itemCount = 0;
  private value = 0;
  private readonly byType = new Map<TileType, number>();

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

  /** What the hold carries, grouped by ore type in collection order. */
  get contents(): CargoEntry[] {
    return [...this.byType.entries()].map(([type, count]) => ({ type, count }));
  }

  /** Adds one ore of the given type/value. Returns false if the hold is full. */
  add(type: TileType, oreValue: number): boolean {
    if (this.isFull) return false;
    this.itemCount += 1;
    this.value += oreValue;
    this.byType.set(type, (this.byType.get(type) ?? 0) + 1);
    return true;
  }

  clear(): void {
    this.itemCount = 0;
    this.value = 0;
    this.byType.clear();
  }

  /** Raises the capacity (e.g. after an upgrade); never drops carried ore. */
  setCapacity(capacity: number): void {
    this.cap = capacity;
  }
}
