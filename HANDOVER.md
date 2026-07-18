# Session Handover — Deep Diggers

Last updated: after Phase 5 (bats + flares), during a fog-of-war playtest.

## TL;DR
Kid-friendly 2D mining game (TypeScript + HTML5 Canvas, Vite, Vitest, **no engine**).
Phases 0–5 are done, committed locally (not pushed). **100 tests pass**, typecheck + build
clean. A quick **fog of war** was added for playtesting (rendering-only). Next up:
**Phase 6 — return tech & polish**.

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
| 6 Return tech & polish | ⏭️ NEXT | Elevator, teleport, low-battery warning, depth tuning, SFX hooks, real-art pass |

Roadmap: `PLAN.md`. Design + deviations: `docs/GDD.md` (§16 decisions log). ADRs: `docs/adr/`.

## How to run (WSL + Windows Node — IMPORTANT)
Node/npm are the **Windows** install. `npm` throws `EISDIR` on stderr under WSL unless run
through `cmd.exe` with redirected stdio:
```bash
cd /mnt/d/ProjectGame/MiningGame
cmd.exe /c "npm test        < NUL 1> out.txt 2> err.txt"; cat out.txt   # 100 tests
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
