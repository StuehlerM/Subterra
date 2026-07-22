# Subterra

A minimalist 2D mining game: dig down, collect ore, return to the surface to sell and
upgrade, then dig deeper. Built with TypeScript + HTML5 Canvas (no game engine).

See [`docs/GDD.md`](docs/GDD.md) for the design and [`docs/adr/`](docs/adr) for the key
technical decisions.

## Requirements

- Node.js 22+ and npm.

## Getting started

```bash
npm install       # install dev dependencies (vite, vitest, typescript)
npm run dev       # start the dev server, then open the printed URL
```

Controls: move/drill with **Arrow keys** or **WASD**. **Z** = place dynamite, **X** = confirm
/ flare. **Esc** pauses (the game also auto-pauses when the window loses focus). The game
boots to a **title screen** → **3 save slots** (Left/Right pick, X start, Z back); each slot
is its own world (own seed) with its own money/upgrades. Reaching the surface auto-sells
ore, recharges and restocks, and opens the **shop menu** (the miner is frozen): **Left/Right**
pick an upgrade, **Down** selects **Drill again**, **Up** goes back, **X** confirms, **Z**
closes instantly. The whole UI is canvas-drawn pictograms — wood/stone panels, a pixel digit
font, and a battery gauge that visibly drains from green to red.

## Art / assets — the game ships zero image files

Every sprite is a **text grid + palette in the source code** (`src/infra/sprites/art/`).
Each character is one pixel; `.` is transparent; a letter looks up a hex colour in the
sprite's palette. At startup each grid is **baked once** onto a cached canvas and the
renderer blits it like a decoded PNG — so the art rides inside the JS bundle (the whole
game — logic, art, and audio — is ~27 KiB gzipped), is diffable in git, greppable, and a
one-character edit away.

Animation = extra frames (a second grid with the bat's wings down, the flame leaning the
other way…). All six ores share **one vein shape** and differ only by a three-colour
palette. Editing art:

- **Type it**: change a letter/dot in a grid, or a hex value in a palette, and reload.
- **Draw it**: make a PNG in any pixel editor (frames as a horizontal strip) and run
  `node tools/graphics/png-to-grid.mjs sprite.png --frames 2`, then paste the output into
  `src/infra/sprites/art/`. `--palette shared.json` matches pixels onto existing named
  colours (strict; `--tolerance N` allows drift, `--force-nearest` snaps everything).

## Scripts

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start the Vite dev server.            |
| `npm run build`     | Typecheck and build for production.   |
| `npm run preview`   | Preview the production build.         |
| `npm test`          | Run the unit tests once (Vitest).     |
| `npm run test:watch`| Run tests in watch mode.              |
| `npm run typecheck` | Typecheck without emitting.           |

Art tooling: `node tools/graphics/png-to-grid.mjs` converts PNGs to text-grid sprites (it has
its own tiny PNG decoder, zero dependencies).

## Architecture (short)

- `src/domain/` — pure game rules (no browser APIs), grouped by concern:
  - `math/` — vectors and directions
  - `world/` — tiles + seeded procedural generation
  - `entities/` — player, bat, dynamite, explosion, falling rock, flare
  - `economy/` — cargo, money, upgrades, consumables, battery, progress
  - `random/` — seeded RNG
- `src/app/` — orchestration: fixed-timestep loop, `Game` step, tuning constants, plus
  `onboarding/` (tutorial + coach), `menu/` (shop), and `i18n/` (strings).
- `src/infra/` — browser adapters, grouped into `audio/`, `sprites/`, and `ui/`: canvas
  renderer, keyboard input, asset registry (bakes the text-grid sprites).
- `tools/` — build-time tooling kept out of the game bundle (`graphics/` holds the
  zero-dependency PNG ↔ text-grid converter).

Dependencies point inward (infra → app → domain), so rules stay testable and art/input/
storage are replaceable. See `docs/adr/0002-architecture.md`.

## Development note (Windows + WSL)

This repo may be developed from WSL while Node/npm live on Windows. If `npm` throws an
`EISDIR` stdio error under WSL, run it through `cmd.exe` with redirected stdio, e.g.:

```bash
cmd.exe /c "npm test < NUL 1> out.txt 2> err.txt"; cat out.txt
```
