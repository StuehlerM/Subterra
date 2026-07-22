import { Vec2 } from '../math/Vec2';

/** Seconds a lit flare glows before burning out. */
const DEFAULT_FLARE_LIFE = 2;

/** Tiles (Chebyshev) within which a flare banishes bats. */
export const FLARE_RADIUS = 4;

/** A lit flare: a bright spot that banishes nearby bats until it burns out. */
export class Flare {
  private life: number;

  constructor(
    public readonly tile: Vec2,
    life: number = DEFAULT_FLARE_LIFE,
  ) {
    this.life = life;
  }

  get isDone(): boolean {
    return this.life <= 0;
  }

  /** 0..1 brightness, for rendering the glow fade. */
  get intensity(): number {
    return Math.max(0, Math.min(1, this.life / DEFAULT_FLARE_LIFE));
  }

  update(dt: number): void {
    this.life -= dt;
  }
}
