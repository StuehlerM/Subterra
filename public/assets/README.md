# Game assets — replace these with your own art

Every image the game draws lives here. To use your own art, **replace a file with
the same name** (keep the filename) and reload the game — no rebuild needed
(`npm run dev` picks it up immediately; for a production build, rebuild).

- Format: **PNG** (transparency supported — great for entities).
- Size: any square size works; **32×32 px** matches one tile. Larger art is scaled
  down to the tile size when drawn.
- Missing a file? The game falls back to a flat colour (tiles) or emoji (entities),
  so nothing breaks.

## Files

### `tiles/` (drawn as full squares)
| File | Tile |
|------|------|
| `sand.png` | Sand (dig through) |
| `rock.png` | Rock (needs dynamite) |
| `bedrock.png` | Bedrock (indestructible) |
| `coal.png` `copper.png` `iron.png` `silver.png` `gold.png` `gem.png` | Ores (cheap → valuable) |

### `background/` (the setting behind everything)
| File | Layer |
|------|-------|
| `sky.png` | Surface backdrop (sky, mountains, trees) shown above the ground line. Any wide image; scaled to screen width. |
| `cave.png` | Underground backdrop, **tiled** behind your tunnels. Make it **seamless** (e.g. 128×128). |

Open/dug tiles are see-through, so this backdrop shows through your tunnels.

### `entities/` (transparent background recommended)
| File | Entity |
|------|--------|
| `player.png` | The miner |
| `bat.png` | Awake / chasing bat |
| `bat_asleep.png` | Sleeping bat |
| `dynamite.png` | Placed dynamite (blinks) |
| `flare.png` | Lit flare (has a glow behind it) |
| `portal.png` | Return-to-surface portal (has a purple glow behind it) |

The current files are auto-generated placeholders. Regenerate them any time with:

```
npm run assets
```
