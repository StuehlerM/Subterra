import { describe, expect, it } from 'vitest';
import { INSTRUMENTS } from '../../src/infra/audio/instruments';
import { parseChannel, secondsPerBeat } from '../../src/infra/audio/notation';
import { MUSIC } from '../../src/infra/audio/tracks';
import { SFX } from '../../src/infra/audio/sfx';

const MAX_SFX_SECONDS = 1.5;

const REQUIRED_SFX = [
  'walk', 'drill', 'sell', 'upgrade', 'menu_move', 'menu_confirm', 'menu_open',
  'dynamite_place', 'explosion', 'flare', 'bat_wake', 'knockout', 'portal',
  'ore_coal', 'ore_copper', 'ore_iron', 'ore_silver', 'ore_gold', 'ore_gem',
];

describe('instruments', () => {
  it('keeps every preset in sane ranges', () => {
    for (const [name, inst] of Object.entries(INSTRUMENTS)) {
      expect(inst.volume, name).toBeGreaterThan(0);
      expect(inst.volume, name).toBeLessThanOrEqual(1);
      expect(inst.attack, name).toBeGreaterThanOrEqual(0);
      expect(inst.release, name).toBeGreaterThanOrEqual(0);
    }
  });
});

describe('music tracks', () => {
  it('title, mining and deep all exist', () => {
    expect(Object.keys(MUSIC).sort()).toEqual(['deep', 'mining', 'title']);
  });

  it('every channel parses and uses a known instrument', () => {
    for (const [name, track] of Object.entries(MUSIC)) {
      expect(track.bpm, name).toBeGreaterThan(0);
      for (const channel of track.channels) {
        expect(INSTRUMENTS[channel.instrument], `${name}/${channel.instrument}`).toBeDefined();
        expect(() => parseChannel(channel.notes, track.beatsPerBar), name).not.toThrow();
      }
    }
  });

  it('all channels of a track are equally long (loops stay in sync)', () => {
    for (const [name, track] of Object.entries(MUSIC)) {
      const lengths = track.channels.map((c) => parseChannel(c.notes).lengthBeats);
      expect(new Set(lengths).size, name).toBe(1);
      expect(lengths[0], name).toBeGreaterThan(0);
    }
  });
});

describe('sound effects', () => {
  it('covers every effect the game triggers', () => {
    for (const name of REQUIRED_SFX) expect(SFX[name], name).toBeDefined();
  });

  it('every effect parses, is short, and uses a known instrument', () => {
    for (const [name, sfx] of Object.entries(SFX)) {
      for (const channel of sfx.channels) {
        expect(INSTRUMENTS[channel.instrument], `${name}/${channel.instrument}`).toBeDefined();
        const { lengthBeats } = parseChannel(channel.notes);
        expect(lengthBeats * secondsPerBeat(sfx.bpm), name).toBeLessThanOrEqual(MAX_SFX_SECONDS);
      }
    }
  });

  it('each ore tier gets its own chime, fancier as it gets rarer', () => {
    const chimes = REQUIRED_SFX.filter((n) => n.startsWith('ore_')).map(
      (n) => SFX[n].channels.map((c) => c.notes).join(' / '),
    );
    expect(new Set(chimes).size).toBe(chimes.length);
  });
});
