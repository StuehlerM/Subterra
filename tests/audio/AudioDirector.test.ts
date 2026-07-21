import { describe, expect, it } from 'vitest';
import { AudioDirector, AudioSnapshot } from '../../src/infra/audio/AudioDirector';
import { TileType } from '../../src/domain/tiles';

const IDLE: AudioSnapshot = {
  moving: false,
  dug: false,
  collected: null,
  tileX: 0,
  tileY: 0,
  activeDynamites: 0,
  activeFlares: 0,
  awakeBats: 0,
  knockoutFlash: 0,
  menuOpen: false,
  money: 0,
};

function snap(partial: Partial<AudioSnapshot>): AudioSnapshot {
  return { ...IDLE, ...partial };
}

describe('AudioDirector', () => {
  it('is silent while nothing changes', () => {
    const director = new AudioDirector();
    director.update(IDLE);
    expect(director.update(IDLE)).toEqual([]);
  });

  it('ticks softly on every second walked tile, not every one', () => {
    const director = new AudioDirector();
    director.update(IDLE);
    const first = director.update(snap({ moving: true, tileX: 1 }));
    director.update(snap({ tileX: 1 })); // move ended
    const second = director.update(snap({ moving: true, tileX: 2 }));
    expect([...first, ...second].filter((s) => s === 'walk')).toHaveLength(1);
  });

  it('grinds when the move started by digging', () => {
    const director = new AudioDirector();
    director.update(IDLE);
    expect(director.update(snap({ moving: true, dug: true }))).toContain('drill');
  });

  it('chimes the collected ore tier on top of the drill', () => {
    const director = new AudioDirector();
    director.update(IDLE);
    const sounds = director.update(snap({ moving: true, dug: true, collected: TileType.Gold }));
    expect(sounds).toContain('drill');
    expect(sounds).toContain('ore_gold');
  });

  it('booms once when a dynamite goes off, and clicks when placed', () => {
    const director = new AudioDirector();
    director.update(IDLE);
    expect(director.update(snap({ activeDynamites: 1 }))).toContain('dynamite_place');
    expect(director.update(snap({ activeDynamites: 0 }))).toContain('explosion');
    expect(director.update(snap({ activeDynamites: 0 }))).toEqual([]);
  });

  it('whooshes on flares and shrieks on waking bats', () => {
    const director = new AudioDirector();
    director.update(IDLE);
    expect(director.update(snap({ activeFlares: 1 }))).toContain('flare');
    expect(director.update(snap({ activeFlares: 1, awakeBats: 2 }))).toContain('bat_wake');
  });

  it('plays the knockout jingle on the flash rising edge only', () => {
    const director = new AudioDirector();
    director.update(IDLE);
    expect(director.update(snap({ knockoutFlash: 1 }))).toContain('knockout');
    expect(director.update(snap({ knockoutFlash: 0.8 }))).toEqual([]);
  });

  it('sparkles on portal jumps but not on knockout respawns', () => {
    const director = new AudioDirector();
    director.update(snap({ tileY: 30 }));
    expect(director.update(snap({ tileY: 2 }))).toContain('portal');
    const director2 = new AudioDirector();
    director2.update(snap({ tileY: 30 }));
    expect(director2.update(snap({ tileY: 2, knockoutFlash: 1 }))).not.toContain('portal');
  });

  it('rings the till when the menu opens richer, greets otherwise', () => {
    const director = new AudioDirector();
    director.update(snap({ money: 10 }));
    expect(director.update(snap({ menuOpen: true, money: 60 }))).toContain('sell');
    director.update(snap({ money: 60 }));
    expect(director.update(snap({ menuOpen: true, money: 60 }))).toContain('menu_open');
  });
});
