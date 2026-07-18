/** Immutable 2D vector used for tile coordinates and interpolation. */
export class Vec2 {
  constructor(
    public readonly x: number,
    public readonly y: number,
  ) {}

  add(other: Vec2): Vec2 {
    return new Vec2(this.x + other.x, this.y + other.y);
  }

  equals(other: Vec2): boolean {
    return this.x === other.x && this.y === other.y;
  }

  static lerp(a: Vec2, b: Vec2, t: number): Vec2 {
    return new Vec2(a.x + (b.x - a.x) * t, a.y + (b.y - a.y) * t);
  }
}
