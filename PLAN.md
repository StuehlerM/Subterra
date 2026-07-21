# PLAN — Big UI round: 4× scale, segmented battery, title menu, options (i18n EN/SV/DE), slot delete

## Task
1. **UI scale 2× → 4×** everywhere (icons 64px, text ~20px tall): HUD, shop,
   title, slot picker, hints, pause.
2. **Battery as a wide segmented battery** (per owner's ASCII sketch): shell +
   tip, **5 discrete segments** that vanish as charge drops; **blinks red on
   the last segment** (and while empty, alongside the ⚠️).
3. **Title menu**: `START GAME` / `OPTIONS`, Up/Down + X (Z = back elsewhere).
4. **Options screen**: `SOUND: ON/OFF` (same switch as M) and
   `LANGUAGE: ENGLISH / SVENSKA / DEUTSCH` — both persisted. Language switches
   **all** UI text live (strings, tutorial hints, upgrade names).
5. **Slot delete**: in the slot picker, **Down** highlights a red `DELETE`
   button under the selected (occupied) slot → X → confirmation dialog
   (`DELETE?` X = yes, Z = no) → slot wiped back to `NEW GAME`.

## Owner decisions
- Languages: English, Svenska, Deutsch (uppercase; German ß written SS as per
  all-caps convention; new glyphs Å Ä Ö Ü as 3×5 with compressed diacritics).
- Delete lives in the slot picker (variant (a)), with confirm dialog.
- 4× is a fixed scale (no window-responsive scaling for now).

## Architecture
- `src/infra/sprites/art/ui.ts` — glyphs Å Ä Ö Ü; new `BATTERY_WIDE` icon
  (26×12 shell + tip) + exported segment geometry (5 slots, 3px + 1px gap).
- `src/app/strings.ts` — three full string tables; `Language` type;
  `setLanguage()/currentStrings()/tutorialHints()/upgradeNames()`; test:
  every string in every language uses only drawable glyphs; all languages
  have identical key sets.
- `src/infra/LanguageStore.ts` — persisted language (like MuteStore). Tested.
- `src/app/Tutorial.ts` — returns the hint **index**; text resolved at draw
  time so a language switch retitles the active hint immediately. Tests updated.
- `src/app/AppFlow.ts` (TDD) — new states/cursors:
  - Title: menu cursor (start/options), Up/Down + confirm.
  - `Screen.Options`: cursor over [sound, language]; confirm/left-right emit
    nothing — main interprets (flow stays pure navigation).
  - SlotSelect: row state (slots ↔ delete button), `Screen.ConfirmDelete`,
    delete only offered on occupied slots (flow told via `setSlotOccupied`).
- `SaveRepository.deleteSlot(slot)` — tested.
- Painters — scale constants to 4×; title menu buttons; options screen;
  DELETE button + confirm dialog; segmented battery with blink
  (`frameIndexAt`, red at ≤1 segment); all text via `currentStrings()`.
- `main.ts` — options actions (toggle mute / cycle language), delete wiring.

## Steps (TDD; commit per milestone)
1. Glyphs + battery art + geometry — art tests first.
2. i18n tables + LanguageStore + Tutorial index refactor — tests first.
3. AppFlow title menu / options / delete flow — tests first.
4. `deleteSlot` — test first.
5. Painters at 4× + new screens + segmented blinking battery; wire main.ts.
6. Playtest (readability at 4×, blink feel, delete flow) + docs + commit.

## Verification
- All 224 tests stay green + new ones; typecheck/build clean; zero assets.
- Manual: language switch retitles title/hints/shop instantly and survives
  reload; delete requires the confirm; battery blinks red on last segment.

## Status
- [x] Plan written
- [ ] **Awaiting explicit go-ahead**
