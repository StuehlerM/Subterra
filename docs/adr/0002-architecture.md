# ADR 0002: Game Architecture — Layered core with system-based update loop

## Context
The game will grow: more ore types, tools, hazards, upgrades, and later touch controls,
audio, and real art. We want the game *rules* (digging, gravity, economy, bats) to be
testable and independent of rendering/input/storage, so we can expand and swap art safely.

## Decision
Use a **layered architecture** with a lightweight, system-based update loop:

- **Domain (pure, no browser APIs)**
  - `World`/`TileMap` (chunked grid + tile types), deterministic **procedural generation**
    from a numeric **seed**.
  - Entities: `Player`, `Bat`, `Dynamite`, `FallingRock`.
  - Rules as **systems** operating on state: `MovementDigSystem`, `RockGravitySystem`,
    `DynamiteSystem`, `BatAISystem`, `LightSystem`, `EconomySystem`.
  - Value objects: `TileType`, `OreType`, `Upgrade`, `Vec2`.
- **Application**
  - `Game` orchestrator with a **fixed-timestep** logic update (grid moves tween between
    tiles for smooth visuals) and a render step.
  - `GameState` (menu / playing / shop / knocked-out).
- **Infrastructure (browser-facing adapters)**
  - `CanvasRenderer` (reads state, draws via **AssetRegistry** — placeholders now, sprites
    later).
  - `InputController` (keyboard now; touch later) → emits intent, never touches domain
    internals directly.
  - `SaveRepository` (localStorage) for meta progress (money, upgrades, seed).

**Dependency rule**: Domain depends on nothing; Application depends on Domain;
Infrastructure depends on Application/Domain via small interfaces. Rendering/input/storage
are replaceable adapters.

## Consequences

### Positive
- Game rules are unit-testable without a DOM/canvas.
- New content = new tile/ore/entity + a system tweak; low coupling.
- Art/input/storage are swappable (asset registry, input adapter, save adapter).
- Deterministic seed → save the meta, regenerate the world (small saves, reproducible).

### Negative
- More upfront structure than a single-file prototype.
- Fixed-timestep + tweened grid movement needs careful interpolation for smoothness.
- Chunked infinite world adds some bookkeeping vs. a fixed-size map.

## Alternatives Considered
- **Single-file game object (everything mixed)**: Pros: fastest to start. Cons: hard to
  test/expand; rendering and rules tangle quickly as features pile up.
- **Full ECS library**: Pros: very flexible for many entities. Cons: overkill for a handful
  of entity types; our "systems over plain state" gives most benefits without the library.
- **Fixed-size finite map (no chunks)**: Pros: simpler. Cons: caps depth/exploration; we
  want effectively infinite downward digging.
