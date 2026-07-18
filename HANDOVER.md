# Session Handover — Deep Diggers

Last updated: end of the Phase 3 session.

## TL;DR
Kid-friendly 2D mining game (TypeScript + HTML5 Canvas, Vite, Vitest, **no engine**).
Phases 0–3 are done, committed locally (not pushed). **71 tests pass**, typecheck + build
clean. Next up: **Phase 4 — Falling rocks**.

## Where we are
| Phase | Status | Summary |
|-------|--------|---------|
| 0 Skeleton | ✅ | Fixed-timestep loop, seeded world, grid movement w/ tween, canvas renderer |
| 1 Dig & world | ✅ | Sand + drilling, bedrock walls/floor, open-air surface, top-right spawn |
| 2 Ore & economy | ✅ | 6 ore tiers (value + hardness gating), cargo, battery, base auto-sell/recharge, 4 upgrades, HUD, shop, localStorage save |
| 3 Rocks & dynamite | ✅ | Rock tile, dynamite (fuse→3×3 blast, no friendly fire, preserves ore/bedrock), restock at base, dynamite-capacity upgrade, keyboard pictogram shop, emoji HUD |
| 4 Falling rocks | ⏭️ NEXT | Freed rocks fall (gravity) with a "wobble" tell; gentle knock-out → respawn at surface losing that run's cargo |
| 5 Bats | ⏭️ | Sleeping bats in caves, wake/chase, instant knock-out, flares (X) banish, tire→resleep |
| 6 Return tech & polish | ⏭️ | Elevator, teleport, low-battery warning, depth tuning, SFX hooks, real art swap |

Details/roadmap: `PLAN.md`. Design: `docs/GDD.md`. Decisions: `docs/adr/`.

## How to run (WSL + Windows Node — IMPORTANT)
Node/npm are the **Windows** install, invoked from WSL. `npm` throws an `EISDIR` stdio
error unless run through `cmd.exe` with redirected stdio. Use this pattern:

```bash
cd /mnt/d/ProjectGame/MiningGame
cmd.exe /c "npm test        < NUL 1> out.txt 2> err.txt"; cat out.txt   # 71 tests
cmd.exe /c "npm run typecheck < NUL 1> out.txt 2> err.txt"; cat out.txt
cmd.exe /c "npm run build    < NUL 1> out.txt 2> err.txt"; cat out.txt
cmd.exe /c "npm run dev      < NUL 1> out.txt 2> err.txt" &            # then open the printed URL
```
`node.exe` works directly; only `npm` needs the redirect wrapper. Deps are installed
(`node_modules/` present, gitignored).

## Controls (locked: 6 keys)
- Move/drill: Arrows or WASD.
- **Z** = place dynamite (underground). **X** = flare (reserved; activates Phase 5).
- At the surface base the shop auto-opens: **Z** cycles the highlighted upgrade, **X** buys.
- Reaching the surface auto-sells cargo, recharges battery, restocks dynamite, and saves.
- UI is pictograms only: 🪙 money · 📦 cargo · 🔋 battery · 🧨 dynamite · ⬇️ depth.

## Architecture (see docs/adr/0002)
Dependencies point inward: `infra → app → domain`. Domain is pure (no browser APIs), fully
unit-tested.
- `src/domain/` — rules & data: `tiles`, `World` (seeded gen: surface, sand, ore, rock,
  bedrock), `Player` (move/drill, battery/cargo/dynamite), `Cargo`, `Battery`, `Consumable`,
  `Dynamite`, `Explosion`, `Economy`, `upgrades`, `PlayerProgress`, `Rng`, `Vec2`, `Direction`.
- `src/app/` — `Game` (step, base economy, dynamite mgmt, buyUpgrade), `FixedTimestep`,
  `constants`.
- `src/infra/` — `CanvasRenderer`, `InputController`, `AssetRegistry` (art-swap point),
  `Hud`, `Shop`, `SaveRepository`.
- Tests in `tests/` (Vitest). Helper: `tests/helpers/worldFrom.ts` builds worlds from ASCII
  maps — legend `.` empty `s` sand `#` bedrock `C` coal `I` iron `G` gold `R` rock.

## Confirmed design decisions (kid-friendly)
- Battery 0 = can walk, can't drill (forces a trip home). No player gravity — only rocks fall.
- Flares banish bats; bats tire and re-sleep. Failure loses only the current run's cargo.
- Save = money + upgrade levels in localStorage; world regenerates from seed.

## Next session — Phase 4 plan (TDD)
Target: falling rocks + gentle knock-out.
1. Domain first (tests → impl):
   - Rock becomes "freed" and **falls** when the tile directly below is empty (from digging
     under it or a blast clearing below). Add a `RockGravitySystem`/update that moves freed
     rocks down one tile per tick until they rest on solid ground.
   - "Wobble" telegraph: brief delay/flag before a rock starts falling (so kids can react).
   - Knock-out: if a falling rock enters the player's tile → knock-out.
2. App: `Game.step` runs rock gravity each fixed step; on knock-out trigger respawn at spawn,
   `cargo.clear()`, keep money/upgrades; expose a transient "knocked out" state for a fade.
3. Infra: render falling/wobbling rocks; simple fade overlay on knock-out.
4. Keep everything deterministic and unit-tested; commit locally after the phase.

Open question to raise with the owner before/while doing Phase 4: should dynamite-freed
rocks above the player also threaten falling immediately, or only after the player moves?
(Current lean: rock falls when unsupported, with a short wobble grace period.)

## Git
Local only, do **not** push. Commit after each phase with a `feat(phaseN): …` message.
Latest: `4121227` (Phase 3). Working tree clean.
