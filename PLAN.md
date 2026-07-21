# PLAN — Canvas game UI (title + 3 save slots, HUD, shop, pause)

> Previous task (text-grid sprite system + playtest fixes) is complete — see git
> history and `docs/ROADMAP.md`. Sound/SFX is explicitly **the phase after this**.

## Task
Replace the DOM overlays with a **canvas-native, fantasy wood/stone styled UI**
drawn with the existing text-sprite system:

1. **Title screen** with a logo/emblem and a **3-save-slot picker** (small "load
   game" flow; slots show 🪙 money or an empty-slot mark).
2. **HUD in canvas**: pictograms + numbers via a tiny pixel digit font; the
   **battery drawn as an actual battery** whose fill lowers (green → yellow →
   red), cargo as a crate that fills up; dynamite/flare counts; depth.
3. **Shop menu in canvas** (same behaviour as today: Left/Right pick, Down =
   Drill again, X buy/confirm, Z close; opens on surface arrival, freezes miner).
4. **Pause screen** (wood panel, ⏸ pictogram).
5. Controls stay exactly as they are (arrows/WASD + Z + X, pictograms only).

## Decisions (confirmed by owner)
- **Pause**: **Esc** toggles pause (meta key; the 6 gameplay keys unchanged),
  plus auto-pause when the window loses focus.
- **Slots**: existing single save migrates into slot 1 (keeps its old fixed
  seed). No slot-delete UI in v1 (console wipe stays); delete/copy = future.
- **New game per slot**: each slot stores **its own world seed** alongside
  money/upgrades. Picking an empty slot rolls a fresh random seed and starts
  with zero upgrades; picking a used slot regenerates *its* world from *its*
  seed and continues its progress.

## Architecture (dependencies stay infra → app → domain)
- `src/app/AppFlow.ts` — **pure, tested** screen state machine:
  `Title → SlotSelect → Playing ⇄ Paused`. Owns slot-cursor + which screen
  consumes keys; gameplay input only reaches `Game` in `Playing`.
- `src/app/ShopMenu.ts` — extract the shop **selection/buy logic** out of the
  DOM `Shop` into a tested app model (Boy Scout: state was living in infra).
- `SaveRepository` — 3 slots (`…-save-v1:slot{0..2}`); the blob gains a
  `seed` field; `slotSummaries()` for the picker; legacy-key migration (old
  blob → slot 1 + the old fixed seed). Tested against an in-memory Storage
  fake. `main.ts` builds the world from the chosen slot's seed.
- `src/infra/sprites/art/ui.ts` — UI art as text grids: 9-slice **wood panel**
  + **stone frame**, 3×5 **digit font** (0–9, `/`), icons (coin, crate,
  battery shell, dynamite, flare, depth arrow, pause bars, ⛏️⬇️ drill-again),
  upgrade icons (reuse entity/tile grids where possible), 32×32 title emblem.
- `src/infra/ui/*Painter.ts` — thin canvas painters (9-slice stretch, number
  layout, gauge fills) driven by the app models; pure layout/gauge math lives
  in tested helpers (e.g. `filledUnits(current, capacity, units)`).
- **Delete** DOM `Hud` + `Shop`; `main.ts` wires `AppFlow` between input,
  `Game`, and the painters.

## Steps (TDD; commit per milestone)
1. **AppFlow** — RED: boot lands on Title; X → SlotSelect; Left/Right cursor;
   X picks slot; Esc toggles pause only while playing; blur pauses; gameplay
   keys ignored outside Playing. GREEN: implement.
2. **Save slots** — RED: 3 independent slots (each with own seed), fresh-seed
   creation for empty slots, summaries, legacy migration keeps old seed,
   corrupt-JSON safety. GREEN: extend `SaveRepository`.
3. **ShopMenu model** — RED: port menu behaviour specs (navigate, buy success/
   fail, drill-again, close). GREEN: extract from DOM Shop; `Game` unchanged.
4. **UI art + helpers** — RED: art validation (digit glyphs 3×5, 9-slice
   pieces consistent, icons 16×16), gauge math. GREEN: draw the art.
5. **Painters + wiring** — HUD/shop/title/pause painters on canvas; remove DOM
   overlays; typecheck/build; zero regressions in existing 138 tests.
6. **Playtest + polish** — owner eyeballs style/feel; tune grids/colors.
7. **Docs** — GDD §11/§12/§16, HANDOVER, README controls section.

## Verification
- All existing tests stay green + new AppFlow/save/menu/art/gauge tests.
- Build clean; still zero image files; UI keys unchanged for gameplay.
- Manual playtest of: cold start → title → empty slot (fresh world) → play →
  surface menu → pause → refresh → slot shows money → continue (same world);
  second slot gives a different world.

## Status
- [x] Plan written
- [ ] **Awaiting explicit go-ahead — do not implement before owner approval**
