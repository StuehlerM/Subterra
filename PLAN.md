# PLAN — Text-based sprite system (zero PNGs)

> Previous roadmap preserved at `docs/ROADMAP.md`.

## Task
Replace the PNG asset pipeline entirely with a text-grid sprite system (à la the
"pixel art as text" approach): every sprite is a character grid + named palette in
the source code, baked once to a cached canvas at startup, then blitted by the
renderer like any image. Includes multi-frame animation, shared-shape/many-palettes
ore tiles, grid-based backgrounds, and a PNG→grid converter script.

## Decisions (confirmed with owner)
1. **Full replacement** — delete `public/assets/**`, `scripts/gen-placeholders.mjs`,
   `scripts/gen-backgrounds.mjs`, and all `HTMLImageElement` loading. Animated sprites
   are multi-frame grids (complete replacement, no PNG exceptions).
2. **Resolution**: 16×16 native for tiles + entities (readable/editable text, uniform
   pixel grain), scaled up crisply by the renderer (`imageSmoothingEnabled = false`).
   Backgrounds: sky = 1×N vertical color-ramp grid stretched to the viewport;
   cave = 32×32 tileable dither grid. Baker is size-agnostic, so individual sprites
   can be up-resed later if the playtest demands it.
3. **Shared shapes**: one "ore veins in stone" grid + 6 palettes (coal, copper, iron,
   silver, gold, gem). Sand, rock, bedrock get their own grids.
4. **Animation**: 2-frame variants — bat (wing flap), bat_asleep (breathing), flare
   (flicker), dynamite (fuse spark), portal (swirl), player (walk leg-swap; frame
   picked from move tween, idle = frame 0). Renderer picks frame by game time.
5. **Converter**: `scripts/png-to-grid.mjs` (own PNG decoder, zero deps) with
   `--frames N`, `--palette`, `--tolerance`, `--force-nearest`. Round-trip tested
   against the existing `scripts/png.mjs` encoder.

## Architecture
- `src/infra/sprites/grid.ts` — **pure, no DOM**: `parseGrid(grid, palette)` →
  `{ width, height, pixels: Uint8ClampedArray (RGBA) }`. Validates ragged rows,
  unknown chars, empty grids. Unit-testable in node.
- `src/infra/sprites/bake.ts` — thin DOM layer: pixels → `ImageData` →
  `OffscreenCanvas` (fallback: regular canvas), cached per sprite+frame.
- `src/infra/sprites/art/` — the art itself: `palettes.ts` (shared colors),
  `tiles.ts`, `entities.ts`, `backgrounds.ts`. Types: `TextureGrid = string[]`,
  sprites declare `frames: TextureGrid[]` + `palette`.
- `AssetRegistry` rework: bakes grids instead of loading PNGs; API becomes
  `tileSprite(tile)`, `entitySprite(name, frame)`, `background(name)` returning
  `CanvasImageSource`. Color fallbacks stay for safety. Renderer types widened
  from `HTMLImageElement` to `CanvasImageSource`; frame index derived from
  elapsed time (named constant `FRAME_DURATION_S`).

## Steps (TDD: red → green → refactor; commit after each milestone)
1. **Grid parser (pure)** — tests: correct RGBA output, transparency dots,
   ragged-row error with row index, unknown-char error with coordinate,
   palette reuse across grids. Then implement `grid.ts`.
2. **Art + validation tests** — write all grids/palettes; tests assert every
   sprite parses, is the declared size, frames of one sprite are same size and
   distinct, ore palettes are distinct.
3. **Bake + registry rework** — swap AssetRegistry internals to baked canvases,
   widen renderer types, add frame selection + animation timing, wire player
   walk frames to the move tween.
4. **Delete PNG pipeline** — remove `public/assets`, both gen scripts, image
   loading code. Verify build output ships zero image files.
5. **Converter** — `png-to-grid.mjs`: PNG decoder (IHDR/PLTE/tRNS/IDAT,
   unfiltering), grid emitter (keys most-used-first), `--frames`, `--palette`
   strict matching with exact-coordinate errors, `--tolerance`, `--force-nearest`.
   Tests: round-trip grid → PNG (via `scripts/png.mjs`) → grid is identical;
   palette-mismatch error case.
6. **Playtest + polish** — run dev server, eyeball look/animation, tune art.
   Update HANDOVER.md, GDD deviations log, commit.

## Verification
- All existing 100 tests stay green + new sprite/converter tests.
- Typecheck + build clean; `dist/` contains no `.png`.
- Manual playtest for look & animation feel.

## Status
- [x] Plan written
- [x] Steps 1–6 implemented, tested, committed (134 tests, build clean, zero images)

## Playtest change requests (owner, approved)
1. **Emergency drill digs sand only** (was: anything but bedrock). Domain change +
   tests; note the anti-soft-lock tradeoff in the GDD deviations log.
2. **Miner is a girl with pink hair** — rework the player sprite (pink bob under
   the helmet), both walk frames.
3. **Ore visual variants** — 3 vein-shape variants shared by all ores; the renderer
   picks one per tile by a deterministic (x, y) hash so fields don't look stamped.

## Next task (after the above): proper menus / real game UI — to be planned.
