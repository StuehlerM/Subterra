import { Vec2 } from './Vec2';

/** Seconds from placement until the blast. */
const DEFAULT_FUSE_SECONDS = 1.2;

/** A placed stick of dynamite counting down to its blast. */
export class Dynamite {
  private fuse: number;

  constructor(
    public readonly tile: Vec2,
    fuseSeconds: number = DEFAULT_FUSE_SECONDS,
  ) {
    this.fuse = fuseSeconds;
  }

  get fuseRemaining(): number {
    return this.fuse;
  }

  get hasExploded(): boolean {
    return this.fuse <= 0;
  }

  update(dt: number): void {
    this.fuse = Math.max(0, this.fuse - dt);
  }
}
