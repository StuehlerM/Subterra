# Deep Diggers

A kid-friendly 2D mining game: dig down, collect ore, return to the surface to sell and
upgrade, then dig deeper. Built with TypeScript + HTML5 Canvas (no game engine).

See [`docs/GDD.md`](docs/GDD.md) for the design and [`docs/adr/`](docs/adr) for the key
technical decisions.

## Requirements

- Node.js 18+ and npm.

## Getting started

```bash
npm install       # install dev dependencies (vite, vitest, typescript)
npm run dev       # start the dev server, then open the printed URL
```

Controls: move/drill with **Arrow keys** or **WASD**. **Z** = place dynamite, **X** = confirm
(also the flare key, reserved). Reaching the surface auto-sells ore, recharges and restocks,
and pops open a **modal upgrade menu** (the miner is frozen): **Left/Right** pick an upgrade,
**Down** selects **Drill again ⛏️⬇️** (below the row), **Up** goes back, **X** confirms (buy,
or Drill again to leave). **Z** closes the menu instantly (quick "drill again"). The UI is pictograms only (🪙 money · 📦 cargo · 🔋 battery ·
🧨 dynamite · ⬇️ depth).

## Art / assets

All game images live in **`public/assets/`** (`tiles/` and `entities/`). Replace any PNG
with your own art (keep the same filename) and reload — no rebuild needed in `npm run dev`.
Missing files fall back to flat colours (tiles) or emoji (entities). See
`public/assets/README.md` for the file list. Regenerate placeholders with `npm run assets`.

## Scripts

| Command             | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Start the Vite dev server.            |
| `npm run build`     | Typecheck and build for production.   |
| `npm run preview`   | Preview the production build.         |
| `npm test`          | Run the unit tests once (Vitest).     |
| `npm run test:watch`| Run tests in watch mode.              |
| `npm run typecheck` | Typecheck without emitting.           |
| `npm run assets`    | Regenerate placeholder art in public/assets. |

## Architecture (short)

- `src/domain/` — pure game rules (no browser APIs): tiles, world + seeded procedural
  generation, player movement, RNG, vectors. Fully unit-tested.
- `src/app/` — orchestration: fixed-timestep loop, `Game` step, tuning constants.
- `src/infra/` — browser adapters: canvas renderer, keyboard input, asset registry
  (the swap point for real sprites later).

Dependencies point inward (infra → app → domain), so rules stay testable and art/input/
storage are replaceable. See `docs/adr/0002-architecture.md`.

## Development note (Windows + WSL)

This repo may be developed from WSL while Node/npm live on Windows. If `npm` throws an
`EISDIR` stdio error under WSL, run it through `cmd.exe` with redirected stdio, e.g.:

```bash
cmd.exe /c "npm test < NUL 1> out.txt 2> err.txt"; cat out.txt
```
