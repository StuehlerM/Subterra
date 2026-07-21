# PLAN — Text & tutorial (relaxing the no-words policy)

> Previous tasks (text-sprite system, canvas UI + save slots) are complete — see
> git history. Sound/SFX remains the phase after this one.

## Task
Add a small amount of **written text** to the UI plus a **contextual first-run
tutorial**, while keeping the pictogram-first philosophy and the zero-asset
pipeline (letters become new 3×5 text-grid glyphs — still no fonts, no images).

## Decisions (owner-approved defaults)
- **Language: English**, but all strings live in one string table
  (`src/app/strings.ts`) so translation later is a file swap.
- **Where text appears** (supplement, not replacement):
  - Title: game name **"DEEP DIGGERS"** + "PRESS X".
  - Slot picker: **"NEW GAME"** on empty slots; money stays on used slots.
  - Shop: the **highlighted** upgrade's name under the row; "DRILL AGAIN" on
    the button.
  - Pause: **"PAUSED"**.
- **Tutorial**: contextual one-time hints during a slot's first run, shown in a
  wood banner at the bottom; each advances when the action happens (or X):
  1. On first spawn: "DIG DOWN WITH THE ARROWS!"
  2. First ore collected: "ORE! FILL YOUR CARGO!"
  3. Cargo full or battery low first time: "GO UP AND SELL AT THE TOP!"
  4. First shop open: "BUY UPGRADES WITH X!"
  5. After first purchase / shop close: "DIG DEEP AND GET RICH!" (soft goal)
  - Tutorial progress is **saved per slot**; a finished tutorial never returns.
- **Goal**: soft goal only for now ("dig deep and get rich"). A real win
  condition (legendary gem at the bottom + win screen) is noted as a future
  phase in the roadmap, not built now.
- **Font**: extend the existing 3×5 pixel digit font with **A–Z and ! ' ?**,
  uppercase only, rendered at 2× like the digits. No new render tech.

## Architecture
- `src/infra/sprites/art/ui.ts` — extend `DIGIT_FONT` → full `PIXEL_FONT`
  (A–Z, 0–9, `/ ! ? '` and space); art-validation tests cover every glyph.
- `src/app/strings.ts` — every user-facing string as a named constant.
- `src/app/Tutorial.ts` — **pure, tested** step machine. Inputs are game
  events/observations (`update(game)` derives: dug first tile? cargo has ore?
  cargo full/battery low? menu open? bought something?); outputs
  `currentHint(): string | null`. Serializes to a small `{ step }` blob.
- `SaveRepository` — slot blob gains optional `tutorialStep` (backwards
  compatible: missing field = tutorial finished for old saves, EXCEPT brand-new
  slots start at step 0). Tested.
- `src/infra/ui/` — `UiPainter.text()` learns letters (same code path);
  `HintPainter` (bottom wood banner + text + blinking X key); ShopPainter adds
  the selected upgrade's name; ScreenPainters add title/slot/pause labels.
- `main.ts` — owns a `Tutorial` per session; saves step with the slot.

## Steps (TDD; commit per milestone)
1. **Font glyphs** — RED: validation tests for A–Z/punctuation (3×5, distinct,
   parse). GREEN: author the glyphs. Extend `UiPainter.text` width tests? (pure
   `textWidth` already covered by logic — keep painter thin.)
2. **Strings table** — trivial module + test that all tutorial/UI strings only
   use characters the font has (great guard!).
3. **Tutorial machine** — RED: step advancement from game states (dig → ore →
   return → shop → done), X-skip, serialization round-trip, per-slot
   persistence rules. GREEN: implement.
4. **Save integration** — RED: slot blob round-trips `tutorialStep`; legacy
   blobs load as finished. GREEN.
5. **Painters + wiring** — HintPainter banner, shop upgrade names, title/pause
   labels, slot "NEW GAME"; wire tutorial into main.ts session + save.
6. **Playtest + polish** — owner checks readability (2× font) + hint pacing.
7. **Docs** — GDD (§11 controls/UI, §16 deviations: no-words policy relaxed,
   soft goal), HANDOVER, README; add legendary-gem win condition to roadmap
   ideas.

## Verification
- All existing 179 tests stay green + new font/strings/tutorial/save tests.
- Typecheck + build clean; still zero image/font files shipped.
- Manual: new slot shows hints in order and never again after finishing;
  old slot (migrated) shows no hints; all text readable at 1080p.

## Status
- [x] Plan written
- [ ] **Awaiting explicit go-ahead — do not implement before owner approval**
