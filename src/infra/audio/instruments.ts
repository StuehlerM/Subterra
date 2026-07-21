/**
 * Instrument presets — the audio equivalent of the sprite palettes. A voice is
 * an oscillator (or noise) shaped by a simple attack/release envelope.
 */

export type WaveKind = OscillatorType | 'noise';

export interface Instrument {
  readonly wave: WaveKind;
  /** Seconds to fade in. */
  readonly attack: number;
  /** Seconds to fade out after the note's beats end. */
  readonly release: number;
  /** Per-instrument gain (0..1); the mix keeps music under the SFX. */
  readonly volume: number;
  /** Noise only: band-pass Q. Lower = wider band = rougher (default 1.2). */
  readonly q?: number;
}

export const INSTRUMENTS: Record<string, Instrument> = {
  /** Soft melodic lead. */
  lead: { wave: 'triangle', attack: 0.02, release: 0.1, volume: 0.35 },
  /** Warm sustained background chords. */
  pad: { wave: 'sine', attack: 0.08, release: 0.3, volume: 0.3 },
  /** Round low notes. */
  bass: { wave: 'triangle', attack: 0.02, release: 0.08, volume: 0.4 },
  /** Tiny UI square blips. */
  blip: { wave: 'square', attack: 0.005, release: 0.05, volume: 0.2 },
  /** Bright bell for ore and rewards. */
  chime: { wave: 'sine', attack: 0.005, release: 0.35, volume: 0.5 },
  /** Very soft percussive noise tap (footsteps, hi-hat). */
  tick: { wave: 'noise', attack: 0.001, release: 0.03, volume: 0.12 },
  /** Grinding noise burst (drilling). */
  grind: { wave: 'noise', attack: 0.01, release: 0.06, volume: 0.25 },
  /** Big filtered-noise hit (explosion, knockout). Wide band = rough. */
  boom: { wave: 'noise', attack: 0.005, release: 0.8, volume: 1.0, q: 0.4 },
  /** Harsh mid-band crackle layered over the boom. */
  crack: { wave: 'noise', attack: 0.002, release: 0.3, volume: 0.6, q: 0.7 },
  /** Airy noise whoosh (flare). */
  air: { wave: 'noise', attack: 0.05, release: 0.25, volume: 0.3 },
  /** Wobbly spooky square (bats, portal). */
  spook: { wave: 'square', attack: 0.02, release: 0.15, volume: 0.25 },
};

export type InstrumentName = keyof typeof INSTRUMENTS & string;
