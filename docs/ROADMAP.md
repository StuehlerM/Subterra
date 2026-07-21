# PLAN — Subterra (mining game)

## Task
Design-first, then build a minimalist, web-based 2D mining game in TypeScript + HTML5
Canvas (no engine). Core loop: dig down → collect ore → return to surface base → sell &
upgrade → dig deeper. Includes sand, destructible rocks (dynamite), indestructible bedrock,
falling-rock and bat hazards, procedural generation, an upgrade economy, and gentle
(rogue-lite) failure. See `docs/GDD.md`, `docs/adr/0001-tech-stack.md`,
`docs/adr/0002-architecture.md`.

## Status
- [x] Requirements gathered (Q&A with owner)
- [x] GDD drafted (`docs/GDD.md`)
- [x] ADR 0001 tech stack, ADR 0002 architecture
- [x] Owner confirmed GDD + all design decisions (GDD §15)
- [ ] Implementation (awaiting explicit go-ahead)

## Confirmed decisions
1. Battery at 0 = can walk, cannot dig → forced to go home to recharge.
2. Flares are the anti-bat tool; bats tire and re-sleep if they lose you.
3. No player gravity; only rocks fall.
4. Exactly 6 keys (4 move/dig + dynamite + flare); shop is automatic at base.
5. Vite fine (tooling free choice); localStorage saves.

## Proposed implementation roadmap (build in vertical slices)
> Each phase is playable. Start rough (placeholder art), expand.

- **Phase 0 — Skeleton** ✅ DONE: Vite + TS project, fixed-timestep game loop, Canvas
  renderer, asset registry, input controller, seeded world, grid movement with tween.
  28 unit tests passing; typecheck clean.
- **Phase 1 — Dig & world** ✅ DONE: Sand tiles + drilling (move into sand removes it),
  bedrock walls/floor, open-air surface band, top-right surface spawn, seeded sand/pillar
  generation. Tests use an ASCII-map helper. 30 tests passing; typecheck clean.
- **Phase 2 — Ore & economy** ✅ DONE: 6 ore tiers (value + hardness gating), cargo hold,
  battery (drains per drill, blocks drilling at 0), surface base auto-sell + recharge,
  4 upgrades (drill strength/speed, cargo, battery), HUD + base shop overlay, localStorage
  save (money + upgrade levels). 57 tests passing; typecheck + build clean.
- **Phase 3 — Rocks & dynamite** ✅ DONE: destructible Rock tile, dynamite consumable
  (Consumable + Dynamite entity, fuse → small blast that clears rock/sand, preserves ore &
  bedrock, no friendly fire), auto-restock at base, dynamite-capacity upgrade. Feedback
  polish shipped: keyboard-only shop (Z=cycle, X=buy at base; Z=dynamite underground),
  pictogram/emoji HUD + shop (no words), save on every surface arrival. 71 tests passing;
  typecheck + build clean.
- **Phase 4 — Falling rocks** ✅ DONE: a Rock with empty space below becomes unsupported →
  short **wobble** tell → falls one tile at a time until it lands (re-becomes a Rock tile).
  If a falling rock enters the miner's tile → gentle **knock-out**: respawn at the surface
  spawn, clear this run's cargo, keep money + upgrades; brief red flash. Chains (stacked
  rocks collapse in sequence). **Event-driven** (no per-frame scan): rocks are re-checked
  only when a tile is emptied by a drill/blast, cascading up the column; a single settle
  pass at startup catches pre-unsupported rocks. 83 tests passing; typecheck + build clean.
- **Phase 5 — Bats** ✅ DONE: cave pockets in procgen (World.generateMap returns bat spawns);
  sleeping bats wake on proximity → chase (grid AI through open tiles at 0.18s/tile, slower
  than walking so you can outrun); touch while awake = knock-out (reuses rock knock-out).
  Flares are a consumable (X underground): light one → nearby bats flee and vanish. Awake
  bats tire and re-sleep after losing you for 3s. New Flare-capacity upgrade (🔦). Renderer
  refactored to take the Game; bats 🦇/😴 and flare 🔥 glow drawn. 100 tests passing; build clean.
- **Phase 6 — Return tech & polish** (IN PROGRESS): swappable image assets in public/assets
  (done); random **return-to-surface portals** (fantasy teleport, cargo kept) placed deep
  underground (done); tuning — more bedrock + fewer ores so progression is slower (done).
  Remaining: battery low-warning polish, elevator (optional), SFX hooks, more depth tuning.

## Menu rework (post-Phase 3) ✅ DONE (76 tests, build clean)
Surface shop becomes a modal menu that freezes the miner:
- Opens on arrival at the surface (and at game start). Auto-sell/recharge/restock/save still run.
- Navigation with normal keys: Left/Right pick an upgrade; Down → "Drill again" button
  (below the row), Up → back to the upgrade row.
- X = confirm (buy the highlighted upgrade, or on "Drill again" leave the menu).
- After Drill again the menu closes and stays closed until the next surface arrival.
- Miner is frozen (movement keys drive the menu, not the miner) while the menu is open.

## Engineering practices (every phase)
- **Write tests** for domain logic (dig rules, rock gravity, dynamite radius/no-friendly-fire,
  bat AI states, economy/upgrades, seeded procgen determinism). Use Vitest.
- Keep domain pure (no DOM) so it's unit-testable per ADR 0002.
- **Commit to git locally after each phase** (do NOT push).

## Notes
- Do NOT start implementation until the owner gives an explicit go-ahead.
