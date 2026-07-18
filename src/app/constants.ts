import { Vec2 } from '../domain/Vec2';

/** Pixel size of one tile when rendered. */
export const TILE_SIZE = 32;

/** Fixed logic timestep (seconds). Logic runs at a stable 60 Hz. */
export const FIXED_DT = 1 / 60;

/** Clamp on frame delta to avoid the "spiral of death" after a stall. */
export const MAX_FRAME_DT = 0.25;

/** World dimensions (in tiles) for the Phase 0 skeleton. */
export const WORLD_WIDTH = 40;
export const WORLD_HEIGHT = 60;

/** Default procedural-generation seed. */
export const DEFAULT_SEED = 1337;

/** Where the miner starts. */
export const SPAWN_TILE = new Vec2(1, 1);
