import { TileType } from '../domain/world/tiles';
import { BACKGROUND_SPRITES } from './sprites/art/backgrounds';
import { ENTITY_SPRITES } from './sprites/art/entities';
import { GRASS_SPRITE, SOIL_BANDS, soilBandIndex, soilPalette } from './sprites/art/soil';
import { SAND_GRID, TILE_SPRITES } from './sprites/art/tiles';
import { BakedSprite } from './sprites/bake';

/**
 * Central place that maps game concepts to how they are drawn. The game ships
 * zero image files: every sprite is a text grid + palette (see sprites/art/**)
 * that gets baked onto a cached canvas once, at startup. The renderer then
 * blits those canvases like it would decoded PNGs.
 */
export class AssetRegistry {
  private readonly tiles = new Map<TileType, BakedSprite>();
  private readonly entities = new Map<string, BakedSprite>();
  private readonly backgrounds = new Map<string, BakedSprite>();
  private readonly soilBands: BakedSprite[] = [];
  private grassSprite!: BakedSprite;

  /** Bakes every text-grid sprite (tiles, entities, backdrops). */
  static withDefaults(): AssetRegistry {
    const registry = new AssetRegistry();
    for (const [tile, sprite] of Object.entries(TILE_SPRITES)) {
      registry.tiles.set(Number(tile) as TileType, BakedSprite.bake(sprite));
    }
    for (const [name, sprite] of Object.entries(ENTITY_SPRITES)) {
      registry.entities.set(name, BakedSprite.bake(sprite));
    }
    for (const [name, sprite] of Object.entries(BACKGROUND_SPRITES)) {
      registry.backgrounds.set(name, BakedSprite.bake(sprite));
    }
    for (let band = 0; band < SOIL_BANDS; band++) {
      const t = band / (SOIL_BANDS - 1);
      registry.soilBands.push(BakedSprite.bake({ frames: [SAND_GRID], palette: soilPalette(t) }));
    }
    registry.grassSprite = BakedSprite.bake(GRASS_SPRITE);
    return registry;
  }

  /** Depth-tinted soil for the ground (t: 0 = topsoil brown, 1 = deep dark). */
  soil(depthFraction: number): BakedSprite {
    return this.soilBands[soilBandIndex(depthFraction, this.soilBands.length)];
  }

  /** Grass-capped topsoil for the exposed surface row. */
  grass(): BakedSprite {
    return this.grassSprite;
  }

  /** The baked sprite for a tile, or null for tiles that draw nothing (Empty). */
  tile(tile: TileType): BakedSprite | null {
    return this.tiles.get(tile) ?? null;
  }

  entity(name: string): BakedSprite {
    return this.demand(this.entities, name, 'entity');
  }

  background(name: string): BakedSprite {
    return this.demand(this.backgrounds, name, 'background');
  }

  private demand(map: Map<string, BakedSprite>, name: string, kind: string): BakedSprite {
    const sprite = map.get(name);
    if (!sprite) throw new Error(`Unknown ${kind} sprite '${name}'`);
    return sprite;
  }
}
