# Game Design Document — "Subterra" (working title)

> A minimalist 2D mining game. Drill down, collect ore, return to the surface to
> sell and upgrade, then dig deeper. Inspired by a time-based museum game (Tekniska),
> but reworked into a relaxed, no-timer, upgrade-driven loop.

## 1. Vision & Pillars
- **Relaxed exploration**: No time limit. Progress at your own pace.
- **Satisfying loop**: Dig → collect → return → sell → upgrade → dig deeper.
- **Minimalist stakes**: Failure is gentle (lose *this run's* loot, never your bank/upgrades).
- **Easy to expand**: Simple tiles + entities so we can keep adding ores, tools, hazards.
- **Swappable art**: Start with flat-color/emoji placeholders; replace with real sprites later.

## 2. Target & Platform
- **Audience**: Anyone who likes a simple, approachable game.
- **Platform**: Web browser. HTML5 Canvas + TypeScript, **no game engine**.
- **Input**: Keyboard (WASD/Arrows). Touch controls planned later for tablets.

## 3. Core Gameplay Loop
1. Start at the **surface base** (top-left corner of the world).
2. Dig down/around tile-by-tile in 4 directions.
3. Collect ores (worth money) and manage **Battery** (energy) + **dynamite/flares**.
4. Return to base (walk, later elevator, late-game teleport).
5. **Sell** ores → earn money. **Buy upgrades**. Restock consumables.
6. Dig deeper where ore is richer and hazards are nastier.

## 4. World & Movement
- **Grid-based**, tile-by-tile movement in **4 directions** (up/down/left/right).
- Moving into a diggable tile **digs it** (consuming Battery); moving into empty space walks.
- **No player gravity** (minimalist): the miner can climb freely through any dug/empty
  tunnel. *Only freed rocks fall* (see Hazards). This avoids fall-death frustration.
- World is effectively **infinite downward**, generated in chunks.

### Tile types
| Tile | Behavior |
|------|----------|
| **Sand/Dirt** | Dug instantly (cheap Battery cost). |
| **Ore** (multiple kinds) | Dug like sand but drops money-value on collect. Tougher ores need a stronger drill. |
| **Rock (destructible)** | Cannot be dug by drill. Destroyed only by **dynamite**. |
| **Bedrock (indestructible)** | Never removable. Forms walls/barriers. |
| **Empty/Tunnel** | Walkable air (dug-out or natural cave). |
| **Freed Rock** | A rock with nothing beneath it → **falls** (hazard). |

## 5. Ores & Economy
- Ores get more valuable with depth. Starter tiers (expandable):
  1. **Coal** (shallow, low value)
  2. **Copper**
  3. **Iron** (needs Drill Lv2+)
  4. **Silver**
  5. **Gold**
  6. **Gems/Diamond** (deep, needs top drill, high value)
- **Money** is the single currency. Ore = money on sale. (Crafting can come later.)
- **Cargo capacity**: limited slots; when full you must return to sell. Upgradeable.

## 6. Resources / Consumables
- **Battery (energy)**: drains per dig (and a little per move).
  - At 0 Battery you can still *walk* but **cannot dig** — a gentle nudge to head home
    and recharge/sleep. Low-battery warning overlay. (Not a death.)
  - Auto-recharges to full at base. Upgradeable capacity.
- **Dynamite**: starts at **3 carried**, auto-restocked at base, upgradeable capacity.
  - Placed on a tile, short fuse, then explodes with a **small blast radius**.
  - Destroys destructible rock (and sand/ore) in radius; **never harms the player
    (no friendly fire)** — minimalist. Bedrock is immune.
- **Flares** (banish bats): consumable light source. Light one to create a bright zone that
  makes nearby bats flee & vanish. Upgradeable flashlight later.

## 7. Hazards
- **Falling rocks**: A destructible rock becomes "freed" when the tile directly below it
  becomes empty (you dug under it, or dynamite cleared below). It falls until it hits
  something. If it falls onto the player → **knock-out** (see Failure). Telegraphed by a
  brief "wobble" before falling so the player can react.
- **Base is a bat-safe zone (bugfix)**: bats can't knock the miner out while at the
  surface, and any bat still *chasing* when the miner reaches home gives up (flees and
  vanishes). Fixes a soft-lock where a bat that followed the miner up struck the frozen
  miner on every respawn — stuck forever.
- **Bats**: Sleep in natural cave pockets deeper down. Proximity/noise (digging nearby)
  **wakes** them. Awake bats chase the player.
  - Touch = **instant knock-out** (minimalist wording, not "death").
  - **Escape**: outrun them (player can break line-of-sight/close distance via tunnels),
    or use a **flare/light** to make them flee and vanish. Bats tire and return to sleep
    if they lose the player for a few seconds.

## 8. Failure (minimalist rogue-lite)
- On knock-out (crushed or bat touch): screen fades, miner "wakes up" at base.
- **Penalty**: lose **only the ore/cargo collected this run** (not yet sold).
- **Kept**: money already banked, all upgrades, and consumable *capacity* (restocked).
- No lives, no game-over screen. Just try again.

## 9. Upgrades (bought at base)
| Upgrade | Effect | Tiers |
|---------|--------|-------|
| **Drill Strength** | Dig tougher ores (unlock Iron→Gold→Gems) | 1–5 |
| **Drill Speed** | Faster dig animation / lower Battery per dig | 1–5 |
| **Battery Capacity** | Dig/travel longer before returning | 1–5 |
| **Cargo Capacity** | Carry more ore per run | 1–5 |
| **Dynamite Capacity** | Carry more dynamite (3 → more) | 1–5 |
| **Blast Radius** | Slightly bigger explosions (still no friendly fire) | 1–3 |
| **Flashlight/Flare Capacity** | Better/more anti-bat light | 1–3 |
| **Elevator** (mid-game) | Buildable shaft for fast vertical return | one-time + extend |
| **Teleport** (late-game) | Instant return to base from anywhere | one-time |

## 10. Progression Feel
- Early: shallow, mostly sand + coal/copper, occasional rock, no bats. Learn to dig/return.
- Mid: iron/silver, more rocks + dynamite puzzles, first bat caves, buy elevator.
- Late: gold/gems, dense bedrock mazes, more bats, buy teleport. Deep = rich but risky.

## 11. Controls (v1) — **exactly 6 keys** (as implemented)
- **Move/Dig**: Up / Down / Left / Right (Arrow keys or WASD).
- **Place Dynamite**: **Z**.
- **Flare / Confirm**: **X** (universal confirm; flare use arrives in Phase 5).
- **Surface menu**: on arrival the base auto-sells/recharges/restocks and opens a **modal
  upgrade menu** that **freezes the miner**. Left/Right pick an upgrade, Down → **Drill
  again** button, Up → back, **X** confirms (buy or leave), **Z** closes instantly.
- (Touch on-screen D-pad + 2 buttons: later.)

## 12. Art & Audio (text-grid sprites + text-notation sound, zero asset files)
- Every sprite is a **text grid + palette in the source** (`src/infra/sprites/art/`);
  the **AssetRegistry** bakes each grid once onto a cached canvas at startup and the
  renderer blits those like decoded PNGs. Animation = extra frame grids; ores share one
  vein shape with per-ore palettes. `tools/graphics/png-to-grid.mjs` converts pixel-editor PNGs
  into grids (with `--palette` matching onto shared named colours).
- Audio is **text too**, zero dependencies and zero sound files: notes like
  `"C4 . E4 - G4 | ..."` (`.` sustains, `-` rests, `|` bar-checks) are parsed by a pure,
  unit-tested notation module (`src/infra/audio/notation.ts`) and played by a thin
  WebAudio synth (oscillators + filtered noise + envelopes). Instruments are named
  presets — the sound equivalent of palettes. Three mild music loops (title / mining /
  deep-cave, switched by depth with hysteresis) and ~19 SFX (walk tick every 2nd step,
  drill, per-tier ore chimes, sell, upgrade, menu blips, dynamite, explosion, flare,
  bat wake, knockout, portal) live as strings in `tracks.ts` / `sfx.ts`. Trigger rules
  are a testable snapshot-diffing `AudioDirector`. **M** mutes (persisted); the pause
  panel shows the speaker state; the AudioContext unlocks on the first keypress.

## 13. Save/Persistence
- **localStorage** save: money, upgrades, world seed, base position. (Save the *meta*,
  regenerate the world from seed; in-run progress is transient by design.)

## 14. Out of Scope (v1) / Future Ideas
- Crafting, multiple biomes, boss caves, day/night, achievements, leaderboards,
  touch controls, audio. All designed to slot in later.
- **Legendary gem win condition**: a unique gem at the very bottom of the world; finding
  it triggers a win screen ("YOU FOUND THE GREAT GEM!"). Candidate for a future phase
  now that the tutorial states a soft goal.

## 15. Resolved Design Decisions (confirmed by owner)
1. Battery at 0 = can walk, and only the **super-slow emergency drill** works (see §16)
   → strongly encouraged to go home to recharge, but never permanently trapped. ✅
2. **Flares** are the anti-bat tool; bats tire and return to sleep if they lose you. ✅
3. **No player gravity** — player walks everywhere, only rocks fall. ✅
4. Controls limited to **6 keys** total (4 move/dig + dynamite + flare). ✅
5. Build tooling is free choice (Vite fine); saves via **localStorage**. ✅

## 16. Implementation deviations & decisions (living — updated as we build)
Things that differ from the first draft above, decided during build/playtest:
- **Shop is a keyboard modal, not a mouse/touch overlay** (§11). It opens on surface
  arrival and **freezes the miner**; navigated with arrows, **X** confirms, **Z** closes.
  Owner preference (no mouse; pictograms only, minimalist).
- **UI is pictograms/emoji + numbers, no words** (🪙 📦 🔋 🧨 ⬇️; ●/○ level pips; 🪙cost; ⭐ maxed).
- **Walking is faster than drilling**: moving through open/dug tiles is a fixed fast speed
  (0.07 s/tile, = the fastest drill level); drilling solid ground uses the Drill Speed
  upgrade value (0.25 s → 0.07 s). So exploring tunnels feels quick while breaking new
  ground is the thing you upgrade.
- **Emergency drill (anti-soft-lock)**: at 0 battery the miner can still drill — very slowly
  (~1.2s/tile) and for free — but **only through plain sand** (owner decision after playtest;
  was "anything except bedrock"). Ore and rock stay put, so the emergency drill can't harvest
  for free. Tradeoff accepted: a dead battery behind a fallen rock can now strand the miner
  until dynamite is used — revisit in tuning if players get stuck. HUD shows ⚠️ when empty.
- **Battery drains per drill only** (not per move) for now — avoids stranding the player; the
  "little per move" from §6 is deferred/optional tuning.
- **Dynamite blasts preserve ore** (and bedrock); they clear rock + sand only, so ore is
  never wasted. Blast is a 3×3 area; **no friendly fire** (player never harmed).
- **Rock** is a distinct tile from Bedrock: Rock is destructible by dynamite; Bedrock is
  fully indestructible.
- **Save trigger**: on every surface arrival (when the menu opens), plus after purchases,
  plus the moment a new contextual-coach lesson is learned (so it never re-appears).
- **Contextual coach ("show, don't tell")**: alongside the scripted first-run tutorial, an
  event-driven `Coach` teaches tools/hazards *in situ* the first time you meet them, then
  stays quiet forever (learned set persisted per slot). Lessons: **rock blocks the way →
  dynamite (Z)**, **bat within a 2–5 tile band → flare (X)**, **cargo full → go back up**,
  **battery empty → go back up**. Tool lessons only fire when you still hold that consumable;
  danger/urgency-first priority (rock > bat > battery > **supply** > cargo > **portal**); each
  cue shows ~4s once, highlighting the actual thing (amber ring + arrow on the world tile/bat/
  portal, or a pulse on the HUD gauge) with one short line. Coach cue takes precedence over the
  onboarding hint. Also: **supply empty** — dynamite *or* flares hitting 0 (either is enough) →
  pulse the supply panel, “go back up to restock”; **portal** — a portal within 5 tiles →
  highlight it, “step in to warp home with your cargo”.
- **Upgrade set (7)**: Drill Strength, Drill Speed, Cargo, Battery, Dynamite, Blast Radius
  (💥 3 levels: 3×3 → 5×5 → 7×7), Flare (🔦). Elevator & teleport (§9) remain future work.
- **Bats**: sleep in generated caves; wake within 4 tiles; chase through open tiles at
  0.18s/tile (slower than the 0.07s walk, so you can outrun them in tunnels). Touch while
  awake = knock-out. A flare (X, consumable) banishes bats within 4 tiles — they flee then
  vanish. Awake bats that lose you for 3s tire and re-sleep. Contact only knocks out while
  the bat is *awake* (bumping a sleeper just wakes it), for fairness.
- **Art pipeline replaced (post-Phase 5)**: the swappable-PNG system (`public/assets/`,
  placeholder generators, image loading, colour/emoji fallbacks) was **deleted** in favour
  of text-grid sprites baked at startup — 16×16 art per tile/entity, 2-frame animations
  (player walk, bat flap, sleeping-bat breathing, dynamite spark, flare flicker, portal
  swirl), a 1×16 stretched sky ramp and a 32×32 tileable cave speckle. The whole game
  (code + art) ships as one ~12 KiB gzipped JS file with zero image requests.
- **Miner is a girl with pink hair** (owner decision after playtest): pink bob under the
  hard hat, both walk frames.
- **Ore variants**: all ores share **three** vein-shape variants (one palette per ore);
  the renderer picks a variant per tile via a deterministic position hash, so ore fields
  don't look stamped. Tile sprites with multiple grids mean *variants*; entity sprites
  with multiple grids mean *animation frames*.
- **No-words policy relaxed (owner decision)**: short uppercase text now supplements the
  pictograms, drawn with a 3×5 pixel font that lives in the text-grid sprite system (still
  zero shipped fonts/images). Text appears on the title ("DEEP DIGGERS", "PRESS X"), empty
  save slots ("NEW GAME"), the shop (highlighted upgrade's name + "DRILL AGAIN") and pause
  ("PAUSED"). All strings live in `src/app/strings.ts` for later translation.
- **First-run tutorial**: five contextual hints on a wood banner (dig → collect ore →
  go up and sell → buy upgrades → "DIG DEEP AND GET RICH!"), each advancing when the
  player actually does the thing; progress saved per slot; legacy saves never see it.
  The stated goal stays **soft** for now — a real win condition (legendary gem at the
  bottom + win screen) is a future-phase idea (§14).
- **Open sky + soil gradient (playtest)**: the surface no longer fogs the sky (fog is
  clipped to below the ground line) and there's tall open headroom above the valley,
  so up reads as open air. The cliff height was decoupled from the sky band. Ground is
  now depth-tinted: rich-brown topsoil greying through the middle into near-black deep
  down (baked soil bands, pure `soilPalette`), with **grass** on the exposed valley
  floor only (a sand tile whose tile above is open sky — never under the cliffs or in
  dug tunnels).
- **Valley surface + deeper world (playtest)**: the world is much deeper (180 rows) and
  the miner spawns in the **centre of a valley**: sloped bedrock cliffs step down from
  each wall to an open central floor, with **open sky above** (no ceiling). The miner
  is clamped so they can't climb above the shop/surface level into that sky. Ore depths
  were spread (coal 1 → gem 70) and caves/portals increased for the taller shaft.
- **Translation & legend round (playtest)**: Swedish "options" corrected to
  INSTÄLLNINGAR; German drill-again button is now the miners' greeting **GLÜCK AUF!**;
  German/Swedish hint phrasing polished. Tutorial hints restyled: plain white pixel
  text with a drop shadow, **top-center** (the wood banner blended in too much). New
  **controls legend** bottom-left during play (arrows = move, Z = dynamite, X = flare,
  localized), hidden while the shop menu is open.
- **Big UI round (playtest)**: UI scale doubled to 4× (64px icons, ~20px text). The HUD
  battery is now a **wide segmented battery** (5 discrete blocks, transparent shell from
  the text-sprite system) that **blinks red on the last segment** and flashes the whole
  shell when empty. The title got a real menu (START GAME / OPTIONS). **Options**: sound
  on/off and **language: English / Svenska / Deutsch** — full i18n string tables switched
  live and persisted; pixel font gained Å Ä Ö Ü (diacritics in the top row); German ß
  written SS. **Slot delete**: Down on an occupied slot shows a DELETE button, X opens a
  DELETE? dialog (X = yes, Z = no).
- **HUD corners polish (playtest)**: money pouch alone top-right; cargo crate bottom-right
  showing its **contents** (mini ore chips + counts, via new `Cargo.contents`); dynamite +
  flare counts beside it; battery + depth top-left. Shop shows all seven **single-word
  upgrade names above their cells** ("POWER", "BLAST", ...) and the button reads "DRILL!".
  Explosion got a rougher two-layer bang (wide-band boom + crackle), flare an ignition
  whoosh + sparkle, bats a falling shriek + wing flutter.
- **Canvas game UI (post-sprite-system)**: DOM HUD/shop overlays replaced by a canvas
  UI drawn with text-grid sprites — wood/stone nine-slice panels, a 3×5 pixel digit
  font, 16×16 icons. The battery is drawn as a real battery whose fill lowers and
  shifts green→yellow→red; cargo is a crate with a fill bar. **Title screen** (gem
  emblem + blinking X key) leads to a **3-save-slot picker**: each slot is its own
  game with its own random world seed and progress (owner decision); the legacy
  single save migrated into slot 1. **Esc** toggles pause (meta key; the 6 gameplay
  keys unchanged) and the game auto-pauses when the window loses focus. Sound/SFX
  is the next planned phase.
