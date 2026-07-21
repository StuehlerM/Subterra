/**
 * Music as text: `"C4 . E4 - G4 | ..."` — a note starts a one-beat tone, each
 * `.` sustains whatever came before by a beat, `-` is a beat of rest and `|`
 * asserts a bar boundary. This module is pure (no WebAudio) so the whole
 * notation is unit-testable; the synth only ever sees parsed events.
 */

/** One parsed tone: when it starts, how long it lasts, what pitch. */
export interface NoteEvent {
  readonly timeBeats: number;
  readonly durationBeats: number;
  readonly freq: number;
}

export interface ParsedChannel {
  readonly events: readonly NoteEvent[];
  /** Total length including trailing rests (drives loop alignment). */
  readonly lengthBeats: number;
}

const NOTE_PATTERN = /^([A-G])([#b]?)([0-8])$/;
const SEMITONES: Record<string, number> = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const A4_FREQ = 440;
const A4_MIDI = 69;
const SEMITONES_PER_OCTAVE = 12;
const SECONDS_PER_MINUTE = 60;

const SUSTAIN = '.';
const REST = '-';
const BAR = '|';

/** `"C4"`, `"F#3"`, `"Bb2"` → frequency in Hz (equal temperament, A4 = 440). */
export function noteToFrequency(name: string): number {
  const match = NOTE_PATTERN.exec(name);
  if (!match) throw new Error(`Invalid note '${name}' (expected e.g. C4, F#3, Bb2)`);
  const [, letter, accidental, octave] = match;
  const semitone = SEMITONES[letter] + (accidental === '#' ? 1 : accidental === 'b' ? -1 : 0);
  const midi = (Number(octave) + 1) * SEMITONES_PER_OCTAVE + semitone;
  return A4_FREQ * 2 ** ((midi - A4_MIDI) / SEMITONES_PER_OCTAVE);
}

/** Parses one channel of notation into timed note events. */
export function parseChannel(text: string, beatsPerBar?: number): ParsedChannel {
  const tokens = text.split(/\s+/).filter((t) => t.length > 0);
  const events: NoteEvent[] = [];
  let time = 0;
  let lastWasNote = false;

  tokens.forEach((token, index) => {
    const position = `token ${index + 1} ('${token}')`;
    if (token === BAR) {
      if (beatsPerBar !== undefined && time % beatsPerBar !== 0) {
        throw new Error(`Misplaced bar line at ${position}: beat ${time} is mid-bar`);
      }
      return;
    }
    if (token === SUSTAIN) {
      if (time === 0) throw new Error(`Nothing to sustain at ${position}`);
      if (lastWasNote) {
        const last = events[events.length - 1];
        events[events.length - 1] = { ...last, durationBeats: last.durationBeats + 1 };
      }
      time++; // sustaining a rest just extends the silence
      return;
    }
    if (token === REST) {
      lastWasNote = false;
      time++;
      return;
    }
    try {
      events.push({ timeBeats: time, durationBeats: 1, freq: noteToFrequency(token) });
    } catch (cause) {
      throw new Error(`Bad note at ${position}`, { cause });
    }
    lastWasNote = true;
    time++;
  });

  return { events, lengthBeats: time };
}

export function secondsPerBeat(bpm: number): number {
  if (!(bpm > 0)) throw new Error(`Invalid tempo ${bpm} BPM`);
  return SECONDS_PER_MINUTE / bpm;
}
