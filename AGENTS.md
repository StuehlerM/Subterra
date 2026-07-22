# AGENTS.md — working guide for AI agents & contributors

Subterra is a minimalist 2D mining game in **TypeScript + HTML5 Canvas, no game engine**.
This file is the fast orientation for anyone (human or agent) touching the code. For the
design see [`docs/GDD.md`](docs/GDD.md); for the key decisions see [`docs/adr/`](docs/adr).

## Repository map

```
src/
  domain/      Pure game rules — NO browser/DOM/Node APIs. Fully unit-tested.
    math/        Vec2, Direction
    world/       World (seeded procedural generation), tiles
    entities/    Player, Bat, Dynamite, Explosion, FallingRock, Flare
    economy/     Cargo, Economy, upgrades, Consumable, Battery, PlayerProgress
    random/      Rng (seeded)
  app/         Orchestration — wires domain + infra, no rendering.
    Game.ts, AppFlow.ts, FixedTimestep.ts, constants.ts   (core loop + tuning)
    onboarding/  Tutorial, Coach (event-driven, learn-once hints)
    menu/        ShopMenu (selection/buy logic)
    i18n/        strings (all user-facing text tables)
  infra/       Browser adapters — the only layer allowed DOM/WebAudio/localStorage.
    audio/       notation parser, Synth, AudioEngine, AudioDirector, tracks, sfx
    sprites/     text-grid art + bake pipeline (art/ holds the pixel grids)
    ui/          canvas painters (HUD, shop, screens, gauges, hints)
    CanvasRenderer, InputController, SaveRepository, LanguageStore, FogOfWar, AssetRegistry
  main.ts      Composition root (browser entry).
tests/         Vitest specs mirroring src/ (node environment).
tools/         Build-time tooling, NOT shipped in the bundle.
  graphics/    Zero-dependency PNG <-> text-grid sprite converter (+ .d.mts types).
docs/          GDD, ROADMAP, ADRs, art prompts.
```

## Layering rule (enforced by convention + tests)

Dependencies point **inward**: `infra → app → domain`. `domain/` must never import from
`app/` or `infra/`, and must not touch `window`, `document`, `localStorage`, `AudioContext`,
etc. Keep tuning defaults as in-module constants or constructor params so the domain stays
dependency-free and testable. See [`docs/adr/0002-architecture.md`](docs/adr/0002-architecture.md).

## Assets are code

The game ships **zero image/audio files**. Sprites are text grids + palettes in
`src/infra/sprites/art/`; audio is text notation in `src/infra/audio/`. Both are parsed,
validated by tests, and baked/synthesised at runtime. Edit a character or a hex value and
reload. To import a PNG: `node tools/graphics/png-to-grid.mjs sprite.png --frames N` and
paste the output into `src/infra/sprites/art/`.

## Commands

| Command              | What it does                        |
| -------------------- | ----------------------------------- |
| `npm run dev`        | Vite dev server.                    |
| `npm run build`      | `tsc --noEmit` then `vite build`.   |
| `npm run preview`    | Preview the production build.       |
| `npm test`           | Run all Vitest specs once.          |
| `npm run test:watch` | Vitest in watch mode.               |
| `npm run typecheck`  | `tsc --noEmit` only.                |

Toolchain: **Node 22+**, TypeScript 7, Vite 8, Vitest 4. Install with `npm install`.

## Conventions

- **TDD**: write/adjust the Vitest spec first; keep the whole suite green (currently 265
  tests). New domain logic needs unit tests; new infra behaviour that can be extracted
  into a pure object should be (e.g. `AppFlow`, `ShopMenu`, `AudioDirector`, `Coach`).
- **Clean code**: KISS/DRY/YAGNI, SOLID, no magic numbers (name constants, e.g. in
  `app/constants.ts`), stepdown ordering (public methods first, privates last).
- **Imports are relative** within `src/`/`tests/` (no path aliases). If you move a file,
  update every importer and re-run `typecheck` + `test` + `build`.
- Record notable non-obvious decisions in the GDD's running "playtest/decisions" log.

## Windows + WSL gotcha (important)

This repo is often edited from WSL while Node/npm live on **Windows**. Plain `node`/`npm`
under WSL can throw `EISDIR`/`EPERM` on stdio. Run them through `cmd.exe` with redirected
stdio and check the exit code:

```bash
cmd.exe /c "npm test < NUL 1> out.txt 2> err.txt"; echo "EXIT=$?"; cat out.txt
```

`*.txt` is gitignored for exactly these scratch files — never `git add -A` them. Windows
`node` cannot see `/tmp`; keep scratch scripts inside the repo. Verify typecheck/test/build
exit codes are green **before** committing.
