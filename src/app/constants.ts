import { Vec2 } from '../domain/Vec2';

/** Pixel size of one tile when rendered. */
export const TILE_SIZE = 32;

/** Fixed logic timestep (seconds). Logic runs at a stable 60 Hz. */
export const FIXED_DT = 1 / 60;

/** Clamp on frame delta to avoid the "spiral of death" after a stall. */
export const MAX_FRAME_DT = 0.25;

/** World dimensions (in tiles) — a deep shaft with a valley surface. */
export const WORLD_WIDTH = 44;
export const WORLD_HEIGHT = 180;

/** Open-air rows at the top (the valley's sky + sloped cliffs) before ground. */
export const SURFACE_ROWS = 6;

/** Default procedural-generation seed. */
export const DEFAULT_SEED = 1337;

/** Where the miner starts: centre of the valley floor, open sky above. */
export const SPAWN_TILE = new Vec2(Math.floor(WORLD_WIDTH / 2), SURFACE_ROWS - 1);
