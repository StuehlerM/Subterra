import { TileType } from '../domain/tiles';

export interface TileStyle {
  readonly color: string;
}

const MISSING_STYLE: TileStyle = { color: '#ff00ff' };

/**
 * Central place that maps game concepts to how they are drawn. Phase 0 uses
 * flat colors; later this becomes the swap point for real sprite images without
 * touching game logic (see ADR 0002).
 */
export class AssetRegistry {
  private readonly tileStyles = new Map<TileType, TileStyle>();
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

  /** Registers the default placeholder palette (swap for sprites later). */
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
    return registry;
  }
}
