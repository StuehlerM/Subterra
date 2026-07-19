import { TileType } from '../domain/tiles';

export interface TileStyle {
  readonly color: string;
}

const MISSING_STYLE: TileStyle = { color: '#ff00ff' };

/** Filenames (under public/assets/) for each drawable tile. */
const TILE_FILES: Partial<Record<TileType, string>> = {
  [TileType.Sand]: 'tiles/sand.png',
  [TileType.Bedrock]: 'tiles/bedrock.png',
  [TileType.Coal]: 'tiles/coal.png',
  [TileType.Copper]: 'tiles/copper.png',
  [TileType.Iron]: 'tiles/iron.png',
  [TileType.Silver]: 'tiles/silver.png',
  [TileType.Gold]: 'tiles/gold.png',
  [TileType.Gem]: 'tiles/gem.png',
  [TileType.Rock]: 'tiles/rock.png',
};

/** Filenames (under public/assets/) for each drawable entity. */
const ENTITY_FILES: Record<string, string> = {
  player: 'entities/player.png',
  bat: 'entities/bat.png',
  bat_asleep: 'entities/bat_asleep.png',
  dynamite: 'entities/dynamite.png',
  flare: 'entities/flare.png',
};

/**
 * Central place that maps game concepts to how they are drawn. Loads swappable
 * PNGs from public/assets/** (replace a file + reload to see it), and keeps flat
 * colours / emoji as a fallback until images load or if a file is missing.
 */
export class AssetRegistry {
  private readonly tileStyles = new Map<TileType, TileStyle>();
  private readonly images = new Map<string, HTMLImageElement>();
  private playerColor = '#ffd34d';

  registerTile(tile: TileType, style: TileStyle): void {
    this.tileStyles.set(tile, style);
  }

  setPlayerColor(color: string): void {
    this.playerColor = color;
  }

  tileStyle(tile: TileType): TileStyle {
    return this.tileStyles.get(tile) ?? MISSING_STYLE;
  }

  get player(): string {
    return this.playerColor;
  }

  /** The loaded image for a tile, or null (use the colour fallback). */
  tileImage(tile: TileType): HTMLImageElement | null {
    const file = TILE_FILES[tile];
    return file ? this.ready(file) : null;
  }

  /** The loaded image for a named entity, or null (use the emoji/shape fallback). */
  entityImage(name: string): HTMLImageElement | null {
    const file = ENTITY_FILES[name];
    return file ? this.ready(file) : null;
  }

  /** Registers placeholder colours and kicks off loading the swappable images. */
  static withDefaults(): AssetRegistry {
    const registry = new AssetRegistry();
    registry.registerTile(TileType.Empty, { color: '#1c1a2e' });
    registry.registerTile(TileType.Sand, { color: '#c2a15a' });
    registry.registerTile(TileType.Bedrock, { color: '#3a3f4b' });
    registry.registerTile(TileType.Coal, { color: '#2f3033' });
    registry.registerTile(TileType.Copper, { color: '#b87333' });
    registry.registerTile(TileType.Iron, { color: '#a7a19a' });
    registry.registerTile(TileType.Silver, { color: '#d7dce0' });
    registry.registerTile(TileType.Gold, { color: '#ffcf3f' });
    registry.registerTile(TileType.Gem, { color: '#4fd0e3' });
    registry.registerTile(TileType.Rock, { color: '#808791' });
    registry.loadImages();
    return registry;
  }

  private loadImages(): void {
    const base = import.meta.env.BASE_URL;
    for (const file of [...Object.values(TILE_FILES), ...Object.values(ENTITY_FILES)]) {
      if (!file) continue;
      const image = new Image();
      image.src = `${base}assets/${file}`;
      this.images.set(file, image);
    }
  }

  private ready(file: string): HTMLImageElement | null {
    const image = this.images.get(file);
    return image && image.complete && image.naturalWidth > 0 ? image : null;
  }
}
