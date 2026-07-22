/** A unit step on the tile grid (one of up/down/left/right). */
export interface Direction {
  readonly dx: number;
  readonly dy: number;
}

export const UP: Direction = { dx: 0, dy: -1 };
export const DOWN: Direction = { dx: 0, dy: 1 };
export const LEFT: Direction = { dx: -1, dy: 0 };
export const RIGHT: Direction = { dx: 1, dy: 0 };
