# Game Design Document — "Deep Diggers" (working title)

> A kid-friendly 2D mining game. Drill down, collect ore, return to the surface to
> sell and upgrade, then dig deeper. Inspired by a time-based museum game (Tekniska),
> but reworked into a relaxed, no-timer, upgrade-driven loop.

## 1. Vision & Pillars
- **Relaxed exploration**: No time limit. Progress at your own pace.
- **Satisfying loop**: Dig → collect → return → sell → upgrade → dig deeper.
- **Kid-friendly stakes**: Failure is gentle (lose *this run's* loot, never your bank/upgrades).
- **Easy to expand**: Simple tiles + entities so we can keep adding ores, tools, hazards.
- **Swappable art**: Start with flat-color/emoji placeholders; replace with real sprites later.

## 2. Target & Platform
- **Audience**: Kids (and the parent who builds it 🙂).
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
- **No player gravity** (kid-friendly): the miner can climb freely through any dug/empty
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
    (no friendly fire)** — kid-friendly. Bedrock is immune.
- **Flares** (banish bats): consumable light source. Light one to create a bright zone that
  makes nearby bats flee & vanish. Upgradeable flashlight later.

## 7. Hazards
- **Falling rocks**: A destructible rock becomes "freed" when the tile directly below it
  becomes empty (you dug under it, or dynamite cleared below). It falls until it hits
  something. If it falls onto the player → **knock-out** (see Failure). Telegraphed by a
  brief "wobble" before falling so kids can react.
- **Bats**: Sleep in natural cave pockets deeper down. Proximity/noise (digging nearby)
  **wakes** them. Awake bats chase the player.
  - Touch = **instant knock-out** (kid-friendly wording, not "death").
  - **Escape**: outrun them (player can break line-of-sight/close distance via tunnels),
    or use a **flare/light** to make them flee and vanish. Bats tire and return to sleep
    if they lose the player for a few seconds.

## 8. Failure (kid-friendly rogue-lite)
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

## 12. Art & Audio (placeholder-first)
- v1: flat colored tiles / simple shapes / emoji for entities. All art behind an
  **asset registry** so a single swap replaces placeholders with real sprites.
- Audio: optional simple SFX later (dig, explosion, coin, bat).

## 13. Save/Persistence
- **localStorage** save: money, upgrades, world seed, base position. (Save the *meta*,
  regenerate the world from seed; in-run progress is transient by design.)

## 14. Out of Scope (v1) / Future Ideas
- Crafting, multiple biomes, boss caves, day/night, achievements, leaderboards,
  multiple save slots, touch controls, real art/audio. All designed to slot in later.

## 15. Resolved Design Decisions (confirmed by owner)
1. Battery at 0 = can walk, **cannot dig** → forced to go home to recharge/sleep. ✅
2. **Flares** are the anti-bat tool; bats tire and return to sleep if they lose you. ✅
3. **No player gravity** — player walks everywhere, only rocks fall. ✅
4. Controls limited to **6 keys** total (4 move/dig + dynamite + flare). ✅
5. Build tooling is free choice (Vite fine); saves via **localStorage**. ✅

## 16. Implementation deviations & decisions (living — updated as we build)
Things that differ from the first draft above, decided during build/playtest:
- **Shop is a keyboard modal, not a mouse/touch overlay** (§11). It opens on surface
  arrival and **freezes the miner**; navigated with arrows, **X** confirms, **Z** closes.
  Owner preference (no mouse; pictograms only for ages 5–6).
- **UI is pictograms/emoji + numbers, no words** (🪙 📦 🔋 🧨 ⬇️; ●/○ level pips; 🪙cost; ⭐ maxed).
- **Walking is faster than drilling**: moving through open/dug tiles is a fixed fast speed
  (0.07 s/tile, = the fastest drill level); drilling solid ground uses the Drill Speed
  upgrade value (0.25 s → 0.07 s). So exploring tunnels feels quick while breaking new
  ground is the thing you upgrade.
- **Battery drains per drill only** (not per move) for now — avoids stranding kids; the
  "little per move" from §6 is deferred/optional tuning.
- **Dynamite blasts preserve ore** (and bedrock); they clear rock + sand only, so ore is
  never wasted. Blast is a 3×3 area; **no friendly fire** (player never harmed).
- **Rock** is a distinct tile from Bedrock: Rock is destructible by dynamite; Bedrock is
  fully indestructible.
- **Save trigger**: on every surface arrival (when the menu opens), plus after purchases.
- **Upgrade set (7)**: Drill Strength, Drill Speed, Cargo, Battery, Dynamite, Blast Radius
  (💥 3 levels: 3×3 → 5×5 → 7×7), Flare (🔦). Elevator & teleport (§9) remain future work.
- **Bats**: sleep in generated caves; wake within 4 tiles; chase through open tiles at
  0.18s/tile (slower than the 0.07s walk, so you can outrun them in tunnels). Touch while
  awake = knock-out. A flare (X, consumable) banishes bats within 4 tiles — they flee then
  vanish. Awake bats that lose you for 3s tire and re-sleep. Contact only knocks out while
  the bat is *awake* (bumping a sleeper just wakes it), for fairness.
