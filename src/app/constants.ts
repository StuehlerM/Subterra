import { Vec2 } from '../domain/Vec2';

/** Pixel size of one tile when rendered. */
export const TILE_SIZE = 32;

/** Fixed logic timestep (seconds). Logic runs at a stable 60 Hz. */
export const FIXED_DT = 1 / 60;

/** Clamp on frame delta to avoid the "spiral of death" after a stall. */
export const MAX_FRAME_DT = 0.25;

/** World dimensions (in tiles). */
export const WORLD_WIDTH = 40;
export const WORLD_HEIGHT = 60;

/** Number of open-air rows at the top before the ground begins. */
export const SURFACE_ROWS = 3;

/** Default procedural-generation seed. */
export const DEFAULT_SEED = 1337;

/** Where the miner starts: top-right corner, standing on the surface. */
export const SPAWN_TILE = new Vec2(WORLD_WIDTH - 2, SURFACE_ROWS - 1);
