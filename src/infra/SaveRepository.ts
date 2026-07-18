import { PlayerProgress, PlayerProgressData } from '../domain/PlayerProgress';

/**
 * Persists meta-progression (money + upgrade levels) to a Storage backend
 * (localStorage in the browser). The world itself is regenerated from its seed,
 * so only this small blob is saved.
 */
export class SaveRepository {
  constructor(
    private readonly key: string,
    private readonly storage: Storage,
  ) {}

  load(): PlayerProgress | null {
    const raw = this.storage.getItem(this.key);
    if (!raw) return null;
    try {
      return PlayerProgress.fromJSON(JSON.parse(raw) as PlayerProgressData);
    } catch {
      return null;
    }
  }

  save(progress: PlayerProgress): void {
    this.storage.setItem(this.key, JSON.stringify(progress.toJSON()));
  }
}
