# Session Handover — Subterra

Last updated: after **text-notation audio** (music + SFX, zero deps, zero files).

## TL;DR
Kid-friendly 2D mining game (TypeScript + HTML5 Canvas, Vite, Vitest, **no engine**).
Phases 0–5 done + text-sprite art system + canvas UI, committed locally (not pushed).
**222 tests pass**, typecheck + build clean; `dist/` contains **zero asset files of
any kind** (~20 KiB gzipped total). Open: battery low-warning polish, depth tuning,
legendary-gem win condition (GDD §14).

## Audio system (current session)
- `src/infra/audio/`: `notation.ts` pure parser ("C4 . E4 - | ..." → NoteEvents,
  tested), `instruments.ts` presets, `tracks.ts` 3 music loops as text,
  `sfx.ts` 19 SFX as text, `Synth.ts` + `AudioEngine.ts` thin WebAudio layer
  (lookahead loop scheduler, bus gains, track fade), `AudioDirector.ts` tested
  snapshot-diff trigger rules, `MuteStore.ts` persisted M-key mute.
- Music: title (calm) / mining (light) / deep (sparse, depth >25, hysteresis <18).
- Player gained `justCollected` (ore type) for per-tier chimes.
- Unlock: first keydown resumes AudioContext (title "PRESS X" doubles as unlock).

## Canvas UI (current session)
- `src/app/AppFlow.ts` — tested screen state machine Title → SlotSelect → Playing ⇄
  Paused; Esc = meta pause key (InputController.consumePause), auto-pause on blur.
- `src/app/ShopMenu.ts` — shop selection/buy logic extracted from the old DOM Shop
  (tested); Game menu-open state unchanged.
- `SaveRepository` — 3 slots (`deep-diggers-save-v1:slot{0..2}`), each `{seed,
  progress}`; **per-slot worlds** (new slot rolls a fresh seed, zero upgrades);
  legacy single save auto-migrates to slot 0 with the old fixed seed.
- `src/infra/sprites/art/ui.ts` — 3×5 digit font, 16×16 icons, one 24×24 nine-slice
  panel grid (wood + stone palettes), 32×32 gem emblem, BATTERY_INTERIOR rect.
- `src/infra/ui/` — UiAssets (bakes), UiPainter (nine-slice/text/icons/dim/highlight),
  HudPainter (battery drains green→yellow→red behind hollow shell; crate fill bar),
  ShopPainter, ScreenPainters (title/slots/pause share a sky+sand backdrop),
  gauge.ts (pure, tested). DOM `Hud.ts`/`Shop.ts` **deleted**.
- `main.ts` — session-per-slot wiring; game only steps while Playing.

## Text-grid sprite system (current session)
Every sprite is a character grid + palette in source (`src/infra/sprites/art/`):
- `grid.ts` pure parser (no DOM, unit-tested) → RGBA; `bake.ts` bakes to
  OffscreenCanvas once; `animation.ts` pure frame timing; `AssetRegistry` bakes all
  at startup, renderer blits canvases (smoothing off, 16 art px per tile).
- Art: 16×16 tiles (6 ores = ONE vein shape × 6 palettes), 16×16 entities with
  2-frame animations (player walk tied to isMoving, bat flap, sleeping-bat breathing,
  dynamite spark @ fuse blink rate, flare flicker, portal swirl), sky = 1×16 stretched
  ramp, cave = 32×32 tileable speckle.
- `scripts/png-to-grid.mjs`: zero-dep converter with own PNG decoder (8-bit, color
  types 0/2/3/4/6, all filters), `--frames`, `--palette` (strict, exact-coordinate
  errors), `--tolerance`, `--force-nearest`, `--name`. Round-trip tested against
  `scripts/png.mjs` encoder. `.d.mts` files give the JS tools types for TS tests.
- Deleted: `public/assets/`, `gen-placeholders.mjs`, `gen-backgrounds.mjs`,
  `npm run assets`, all HTMLImageElement loading + colour/emoji fallbacks.
- PLAN.md now describes this task; old roadmap moved to `docs/ROADMAP.md`.
- Note: Windows node.exe under WSL also hits EISDIR on stdout — wrap plain `node`
  CLI runs in `cmd.exe /c "node ... 1> out.txt 2> err.txt"` too.

## Where we are
| Phase | Status | Summary |
|-------|--------|---------|
| 0 Skeleton | ✅ | Fixed-timestep loop, seeded world, grid movement w/ tween, canvas renderer |
| 1 Dig & world | ✅ | Sand + drilling, bedrock walls/floor, open-air surface, top-right spawn |
| 2 Ore & economy | ✅ | 6 ore tiers (value + hardness), cargo, battery, base auto-sell/recharge, upgrades, HUD, save |
| 3 Rocks & dynamite | ✅ | Rock tile, dynamite (fuse→blast, no friendly fire, preserves ore), restock, keyboard pictogram shop |
| Menu rework | ✅ | Modal surface menu freezes miner; arrows navigate, X buys, Z/Drill-again closes |
| 4 Falling rocks | ✅ | Wobble tell → fall → settle; touch = knock-out; **event-driven** freeing (no per-frame scan) |
| 5 Bats + flares | ✅ | Cave bats (sleep/chase/flee/resleep), touch=knock-out; flare (X) banishes; Flare-capacity upgrade |
| Fog of war | ✅ (playtest) | Rendering-only torch/vignette around the miner; flares light their area |
| Text-sprite art | ✅ | All art as text grids baked to canvases; zero shipped images; PNG→grid converter |
| Canvas game UI | ✅ | Title + 3 per-seed save slots, wood/stone panels, pixel HUD w/ battery gauge, canvas shop, Esc/blur pause |
| Text & tutorial | ✅ | Pixel font A–Z, strings table, 5 contextual first-run hints saved per slot |
| Audio | ✅ | Text-notation music (3 loops) + 19 SFX, zero deps/files, M mute, AudioDirector triggers |
| 6 Return tech & polish | ⏭️ partial | Portals + tuning done; remaining: **sound/SFX (next)**, low-battery warning, elevator (opt.) |

Roadmap: `PLAN.md`. Design + deviations: `docs/GDD.md` (§16 decisions log). ADRs: `docs/adr/`.

## How to run (WSL + Windows Node — IMPORTANT)
Node/npm are the **Windows** install. `npm` throws `EISDIR` on stderr under WSL unless run
through `cmd.exe` with redirected stdio:
```bash
cd /mnt/d/ProjectGame/MiningGame
cmd.exe /c "npm test        < NUL 1> out.txt 2> err.txt"; cat out.txt   # 222 tests
cmd.exe /c "npm run build    < NUL 1> out.txt 2> err.txt"; cat out.txt
cmd.exe /c "npm run dev      < NUL 1> out.txt 2> err.txt" &            # open the printed URL
```
`node.exe` works directly; only `npm` needs the wrapper. Deps installed (node_modules present).

## Controls (6 keys)
- Move/drill: Arrows or WASD. **Walking open tiles is fast (0.07s); drilling uses the ⚡ upgrade.**
- **Z** = place dynamite (underground). **X** = flare (underground) / **confirm** (in menu).
- Surface menu (modal, freezes miner): Left/Right pick upgrade, Down → Drill again, Up back,
  **X** buys, **Z** closes. Reaching surface auto-sells/recharges/restocks and saves.
- HUD (pictograms): 🪙 money · 📦 cargo · 🔋 battery · 🧨 dynamite · 🔦 flares · ⬇️ depth.

## Architecture (see docs/adr/0002)
Dependencies point inward: `infra → app → domain`. Domain is pure (no browser APIs), tested.
- `src/domain/` — `tiles`, `World` (+`generateMap` returns bat spawns; caves), `Player`,
  `Cargo`, `Battery`, `Consumable`, `Dynamite`, `Explosion`, `FallingRock`, `Bat`, `Flare`,
  `Economy`, `upgrades`, `PlayerProgress`, `Rng`, `Vec2`, `Direction`.
- `src/app/` — `Game` (step, base economy, dynamite, rock gravity, bats/flares, menu,
  knock-out), `FixedTimestep`, `constants`.
- `src/infra/` — `CanvasRenderer` (takes the `Game`; draws tiles/entities + fog),
  `InputController`, `AssetRegistry`, `Hud`, `Shop`, `SaveRepository`.
- Tests in `tests/` (Vitest). Helper `tests/helpers/worldFrom.ts`: `.`empty `s`sand
  `#`bedrock `C`coal `I`iron `G`gold `R`rock.

## Confirmed design decisions (kid-friendly)
- Battery 0 = walk but can't drill; no player gravity (only rocks fall).
- Failure (rock or awake bat) = respawn at surface, lose the run's cargo, keep money/upgrades.
- Save = money + upgrade levels in localStorage (`deep-diggers-save-v1`); world from seed.
- Reset progress: console → `localStorage.removeItem('deep-diggers-save-v1'); location.reload()`.

## Fog of war (playtest, rendering-only)
- Implemented in `CanvasRenderer` as a radial darkness overlay centered on the miner
  (canvas center, since the camera follows the player), with active flares erasing darkness
  in their radius. No domain/logic change, no unit tests. Tuning constants at the top of
  `CanvasRenderer.ts` (`FOG_INNER_TILES`, `FOG_OUTER_TILES`). Easy to remove/toggle.

## Next session — Phase 6 (return tech & polish), TDD
- Elevator (buildable vertical shaft for fast return) and late-game teleport (instant return).
- Low-battery warning overlay; depth-scaled ore/hazard tuning; optional SFX hooks.
- Decide whether fog of war stays (and if so, add a light-radius upgrade + tests) or is
  playtest-only. Real-art swap via AssetRegistry.

## Git
Local only, do **not** push. Commit after each phase (`feat(phaseN): …`). Latest: bats+flares
(`bc45ac8`) then handover + fog. Working tree should be clean after committing.
