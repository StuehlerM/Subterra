# PLAN — Sound: text-notation music & SFX (zero dependencies)

> Previous tasks (sprites, canvas UI, text & tutorial) complete — see git history.

## Task
Add audio with the same philosophy as the art: **sounds are text in the source**.
A pure, unit-tested notation parser turns strings like `"C4 . E4 - G4"` into
timed note events; a thin WebAudio synth plays them. No libraries, no audio
files — the whole soundtrack ships inside the JS bundle.

## Decisions (owner-approved)
- **Zero dependencies** (no ZzFX/Tone.js). WebAudio oscillators + noise +
  envelopes, hand-rolled. If an effect ever feels weak we can vendor ZzFX later.
- **Notation**: `C4`/`F#3`/`Bb2` notes with octave, `.` sustains the previous
  note (like the sprite dots), `-` rest, `|` bar check. Tempo per track;
  instruments are named presets (wave, attack, release, volume, noise, glide)
  — "palettes for sound".
- **Music: 3 mild loops** — `title` (calm), `mining` (light, main gameplay),
  `deep` (sparse, below a depth threshold). Music volume well under SFX.
- **SFX**: walk (very soft tick — "not annoying", tune at playtest), drill,
  ore break (chime pitched by ore tier), sell/coins, upgrade purchase, menu
  move/confirm, dynamite place + explosion, flare, bat wake, knockout, portal.
- **Mute**: **M** toggles sound (classic), persisted in localStorage; the pause
  panel shows the speaker state + an M hint. Speaker on/off = two new 16×16
  icon grids.
- **Autoplay rule**: AudioContext unlocks on the first keypress (the title's
  "PRESS X"); music starts at the slot picker.

## Architecture (dependencies stay infra → app → domain)
- `src/infra/audio/notation.ts` — **pure, no WebAudio**: note→frequency
  (A4 = 440), parser producing `NoteEvent { timeBeats, durationBeats, freq }`
  per channel; errors carry token position; bar-length validation.
- `src/infra/audio/instruments.ts` — preset table (typed params, no magic
  numbers in the synth).
- `src/infra/audio/tracks.ts` + `sfx.ts` — the actual "sheet music" as text.
- `src/infra/audio/Synth.ts` — thin WebAudio layer: one voice = oscillator
  (or noise buffer) + gain envelope; schedules a parsed event list at a time.
- `src/infra/audio/AudioEngine.ts` — facade: `unlock()`, `playSfx(name)`,
  `playMusic(name)` (loop scheduler with lookahead, tiny fade on switch),
  `toggleMuted()` persisted via injected Storage.
- `src/infra/audio/AudioDirector.ts` — observes per-frame game **snapshots**
  (pure delta logic, testable): walk vs drill (via `player.lastDug`), ore
  collected (cargo up + which tile), explosion (active dynamite gone), flare,
  bat wake, knockout (flash rising edge), portal (position jump), arrival
  (menu opens). Purchases/menu nav hook the existing main.ts call sites.
- `main.ts` — engine + director wiring; music choice by screen/depth;
  InputController gains `consumeMute()` (M key).

## Steps (TDD; commit per milestone)
1. **Notation parser** — RED: note names/octaves/sharps/flats → Hz, sustain
   dots merge into duration, rests, bar validation errors with position,
   tempo→seconds helper, multi-channel alignment. GREEN: implement.
2. **Instruments + tracks + SFX data** — RED: every track/sfx parses; channels
   align; every SFX the director needs exists; SFX are short (≤ ~1.5 s);
   ore-chime helper covers all 6 tiers. GREEN: compose the audio.
3. **Mute store + AudioDirector** — RED: mute persistence round-trip (fake
   Storage); director snapshot deltas fire the right SFX names exactly once.
   GREEN: implement. (Synth/Engine stay thin, verified by ear.)
4. **Wiring** — M key, pause-panel speaker + hint, unlock on first gesture,
   music per screen (+ `deep` under depth threshold), director in the loop.
5. **Playtest** — owner checks: music mildness, walk tick annoyance, mix
   levels; tune text/presets (one-line edits).
6. **Docs** — GDD §12 (audio = text notation), HANDOVER, README.

## Verification
- All existing 189 tests stay green + new parser/data/director/mute tests.
- Typecheck + build clean; still zero binary assets of any kind.
- Manual: title → music starts after first key; mining loop in game; deep loop
  far down; M mutes everywhere and survives reload; pause shows speaker state.

## Status
- [x] Plan written
- [x] Implemented (222 tests, build clean) — audio shipped

## Playtest polish round (owner-requested, approved)
1. **Audio**: rougher/bigger explosion; cooler flare sound; cooler bat sound
   (data + instrument tweaks, validation tests keep passing).
2. **Shop**: "DRILL AGAIN" → "DRILL!"; single-word upgrade names drawn **above
   every cell** (all visible at once), cells widened to fit.
3. **Cargo contents** (domain, TDD): Cargo tracks per-ore-type counts; HUD
   shows what's inside with mini ore icons.
4. **HUD layout**: coins alone top-right; cargo (with contents) + dynamite +
   flares bottom-right; battery + depth stay top-left.
