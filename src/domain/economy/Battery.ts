/**
 * The miner's energy. Each drill action drains it. At zero the miner can still
 * walk but cannot drill (design decision) and must return to base to recharge.
 */
export class Battery {
  private charge: number;

  constructor(private cap: number) {
    this.charge = cap;
  }

  get capacity(): number {
    return this.cap;
  }

  get current(): number {
    return this.charge;
  }

  get isEmpty(): boolean {
    return this.charge <= 0;
  }

  drain(amount: number): void {
    this.charge = Math.max(0, this.charge - amount);
  }

  refill(): void {
    this.charge = this.cap;
  }

  /** Raises capacity (e.g. after an upgrade); clamps current charge to it. */
  setCapacity(capacity: number): void {
    this.cap = capacity;
    if (this.charge > capacity) this.charge = capacity;
  }
}
