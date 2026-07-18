# ADR 0001: Tech Stack — TypeScript + HTML5 Canvas, no engine

## Context
We need a 2D, browser-based mining game that is easy for the kids to run/share, cheap to
iterate on, and lets us start with placeholder graphics and swap in real art later.
Constraints from the owner: web-based, HTML5 + TypeScript, **no game engine** (e.g. Godot).
The game is a grid/tile world with simple 2D rendering and modest performance needs.

## Decision
Build with **TypeScript** compiled to run in the browser, rendering via **HTML5 Canvas 2D**,
bundled with **Vite** (fast dev server + build). No game engine, no framework. State is
persisted with **localStorage**. Rendering assets go through a small **asset registry** so
placeholder shapes/emoji can be replaced by sprite images without touching game logic.

Rationale:
- Canvas 2D is more than enough for a tile grid + a handful of entities.
- Vite gives instant reloads and a trivial build; zero-config TS.
- No engine keeps the codebase small, understandable, and fully in our control.
- Plain DOM/Canvas runs anywhere, including museum kiosks and tablets.

## Consequences

### Positive
- Minimal dependencies, small bundle, easy to host as static files.
- Full control over the game loop, procgen, and rendering.
- Easy to unit-test pure domain logic (no engine coupling).
- Art is swappable via the asset registry.

### Negative
- We implement engine-y things ourselves (game loop, input, spritesheet handling).
- No built-in physics/scene tools — fine for a grid game, but manual.
- Canvas 2D (vs. WebGL) may need care if we ever want lots of particles/effects.

## Alternatives Considered
- **Phaser (JS game engine)**: Pros: batteries-included (loop, input, tweens, atlases).
  Cons: an engine (owner said no engine), larger bundle, its own abstractions to learn.
- **Godot (HTML export)**: Pros: full editor, physics, tilemaps. Cons: explicitly excluded
  by owner; heavier; export/tooling overhead; less "just TypeScript".
- **PixiJS (WebGL renderer only)**: Pros: fast rendering. Cons: extra dep we don't need
  yet for a simple tile grid; Canvas 2D suffices for v1 (can adopt later if needed).
- **Plain JS (no TS)**: Cons: loses type safety that helps a growing game codebase.
