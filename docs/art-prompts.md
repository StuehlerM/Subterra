# Art prompts — "Deep Diggers"

Use these to generate **consistent** fantasy artwork for the assets in
`public/assets/`. The trick to consistency: keep the **Style Anchor** identical for
every asset and only change the **Subject**. Reuse the same model, the same seed,
and (if your tool supports it) a **style reference** image from your first good result.

- Game look: **2D side-view (cross-section) mining game** for young kids (ages ~5–6).
- Draw **one asset per image**, centered, filling the frame, **1:1 square**.
- Export **PNG, 32×32 px** (or generate larger, e.g. 512×512, then downscale to 32).
- **Tiles**: opaque, edge-to-edge, **seamlessly tileable** (no border, no drop shadow).
- **Entities**: **transparent background**, single object, soft contact shadow only.

---

## Style Anchor (prepend to EVERY prompt)

> Cute fantasy 2D game art, hand-painted storybook style, vibrant saturated colors,
> bold readable silhouettes, thick clean outlines, soft cel shading, gentle rim light,
> cozy underground mining theme, friendly and kid-appropriate, high contrast so it reads
> at tiny sizes, centered, flat lighting from top-left, 1:1 square, game asset.

## Technical suffix (append to EVERY prompt)

- **Tiles:** `seamless tileable texture, fills the entire square edge to edge, no border, no shadow, top-down block of material, orthographic`
- **Entities:** `single centered sprite, transparent background, side view facing right, small soft shadow under it, no ground, no scenery`

## Negative prompt (all)

> text, letters, watermark, signature, ui, frame, border, multiple objects, busy background,
> photorealistic, gore, scary, harsh shadows, blurry, low contrast, drop shadow (for tiles)

## Consistency tips

- Lock one **seed** and one **model/checkpoint**; change only the Subject line.
- Generate your favorite tile first, then feed it back as a **style reference / image prompt**
  (e.g. Midjourney `--sref`, or img2img at low strength) for all the others.
- Keep the **palette** below so ores stay easy to tell apart at 32 px.
- Optional: ask for a **sprite sheet** ("9 mining blocks in a 3×3 grid, same style") to get a
  matched set in one shot, then slice it.

## Palette (keep ores distinguishable)

| Asset | Color cue |
|-------|-----------|
| sand/dirt | warm tan/brown |
| rock (boulder) | mid grey, rounded |
| bedrock | dark blue-grey, cracked, immovable |
| coal | near-black lumps with sparkle |
| copper | orange-bronze veins |
| iron | dull silver-grey veins |
| silver | bright cool silver, shiny |
| gold | rich yellow-gold, glinting |
| gem/diamond | cyan/turquoise crystal, sparkling |

---

## Per-asset Subjects

Combine as: **Style Anchor** + **Subject** + **Technical suffix** + (negative prompt).

### Tiles (`public/assets/tiles/`)
- **sand.png** — `a square block of soft sandy dirt/earth, small pebbles and grains`
- **rock.png** — `a rounded grey boulder filling the tile, smooth cartoon rock`
- **bedrock.png** — `a dark cracked bedrock block, solid and impenetrable, faint blue tint`
- **coal.png** — `dark earthy block with shiny black coal chunks embedded`
- **copper.png** — `stone block with glowing orange-bronze copper ore veins`
- **iron.png** — `stone block with dull grey iron ore nuggets`
- **silver.png** — `stone block with bright shiny silver ore veins`
- **gold.png** — `stone block with rich glinting gold nuggets`
- **gem.png** — `stone block with sparkling cyan crystal gems`

### Entities (`public/assets/entities/`)
- **player.png** — `a cheerful little cartoon miner with a round helmet and a glowing headlamp,
  holding a small drill, chibi proportions, big friendly eyes, side view`
- **bat.png** — `a cute purple cartoon bat, wings spread, mid-flight, big round eyes, slightly
  mischievous but friendly, side view`
- **bat_asleep.png** — `a cute purple cartoon bat hanging upside down asleep, eyes closed,
  small "zzz", cozy`
- **dynamite.png** — `a friendly cartoon stick of red dynamite with a lit sparkling fuse,
  bundled sticks, no gore`
- **flare.png** — `a glowing warm-orange handheld flare / torch with a bright friendly flame`
- **portal.png** — `a swirling magical purple portal / vortex gateway, glowing runes around the
  rim, sparkly, enchanting, front view` (the game adds a purple glow behind it)

---

## Notes for the game

- The **flare** already has a soft glow drawn behind it in-game, so the sprite itself just needs
  the flare/flame object on transparency.
- **Empty tunnels** use a flat dark background (no image). If you want art there too, add
  `tiles/empty.png` and ask the renderer to use it.
- Any square size works; the game scales each image to one tile. For crisp pixel art, export at
  exactly 32×32 with nearest-neighbor downscaling.
