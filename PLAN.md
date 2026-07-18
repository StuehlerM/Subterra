# PLAN — Deep Diggers (mining game)

## Task
Design-first, then build a kid-friendly, web-based 2D mining game in TypeScript + HTML5
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
- **Phase 3 — Rocks & dynamite**: Destructible rock, dynamite consumable (place/fuse/blast,
  no friendly fire), auto-restock at base, dynamite capacity upgrade.
- **Phase 4 — Falling rocks**: Rock gravity system, "wobble" telegraph, knock-out + gentle
  respawn (lose this run's cargo).
- **Phase 5 — Bats**: Cave pockets in procgen, sleeping bats, wake/chase AI, instant
  knock-out, flares + flee/vanish + tire-and-resleep.
- **Phase 6 — Return tech & polish**: Elevator (mid), teleport (late), battery low-warning,
  depth-scaled ore/hazard tuning, SFX hooks, art-swap pass.

## Engineering practices (every phase)
- **Write tests** for domain logic (dig rules, rock gravity, dynamite radius/no-friendly-fire,
  bat AI states, economy/upgrades, seeded procgen determinism). Use Vitest.
- Keep domain pure (no DOM) so it's unit-testable per ADR 0002.
- **Commit to git locally after each phase** (do NOT push).

## Notes
- Do NOT start implementation until the owner gives an explicit go-ahead.
