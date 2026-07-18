import { describe, expect, it } from 'vitest';
import { FallingRock, RockState } from '../src/domain/FallingRock';
import { Vec2 } from '../src/domain/Vec2';
import { TileType } from '../src/domain/tiles';
import { worldFrom } from './helpers/worldFrom';

const WOBBLE = 0.2;
const FAST_FALL = 100; // tiles/sec, so a small dt clears a tile in tests

describe('FallingRock', () => {
  it('wobbles for the grace period before falling', () => {
    const world = worldFrom(['.', '.', 's']);
    const rock = new FallingRock(new Vec2(0, 0), WOBBLE, FAST_FALL);
    rock.update(WOBBLE / 2, world);
    expect(rock.phase).toBe(RockState.Wobbling);
    rock.update(WOBBLE, world);
    expect(rock.phase).toBe(RockState.Falling);
  });

  it('falls through empty space and settles as a Rock tile on solid ground', () => {
    const world = worldFrom(['.', '.', 's']); // freed rock starts at (0,0)
    const rock = new FallingRock(new Vec2(0, 0), WOBBLE, FAST_FALL);
    rock.update(WOBBLE, world); // finish wobbling
    rock.update(0.05, world); // fall (fast)
    expect(rock.hasLanded).toBe(true);
    expect(rock.tile.equals(new Vec2(0, 1))).toBe(true);
    expect(world.getTile(0, 1)).toBe(TileType.Rock);
    expect(world.getTile(0, 0)).toBe(TileType.Empty);
  });

  it('lands immediately when already resting on solid ground', () => {
    const world = worldFrom(['.', 's']); // rock at (0,0), sand directly below
    const rock = new FallingRock(new Vec2(0, 0), WOBBLE, FAST_FALL);
    rock.update(WOBBLE, world);
    rock.update(0.05, world);
    expect(rock.hasLanded).toBe(true);
    expect(world.getTile(0, 0)).toBe(TileType.Rock);
  });
});
