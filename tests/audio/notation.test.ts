import { describe, expect, it } from 'vitest';
import { noteToFrequency, parseChannel, secondsPerBeat } from '../../src/infra/audio/notation';

describe('noteToFrequency', () => {
  it('tunes A4 to 440 Hz', () => {
    expect(noteToFrequency('A4')).toBeCloseTo(440);
  });

  it('knows naturals, sharps and flats across octaves', () => {
    expect(noteToFrequency('C4')).toBeCloseTo(261.63, 1);
    expect(noteToFrequency('F#3')).toBeCloseTo(185.0, 1);
    expect(noteToFrequency('Bb2')).toBeCloseTo(116.54, 1);
    expect(noteToFrequency('C0')).toBeCloseTo(16.35, 1);
    expect(noteToFrequency('B8')).toBeCloseTo(7902.13, 0);
  });

  it('rejects nonsense notes', () => {
    for (const bad of ['H4', 'C', '4C', 'C#', 'C9', 'c4', '']) {
      expect(() => noteToFrequency(bad), bad).toThrow();
    }
  });
});

describe('parseChannel', () => {
  it('emits one event per note, one beat each', () => {
    const { events, lengthBeats } = parseChannel('C4 E4');
    expect(lengthBeats).toBe(2);
    expect(events).toHaveLength(2);
    expect(events[0]).toMatchObject({ timeBeats: 0, durationBeats: 1 });
    expect(events[1]).toMatchObject({ timeBeats: 1, durationBeats: 1 });
    expect(events[0].freq).toBeCloseTo(261.63, 1);
  });

  it('dots sustain the previous note', () => {
    const { events } = parseChannel('C4 . . E4');
    expect(events[0].durationBeats).toBe(3);
    expect(events[1].timeBeats).toBe(3);
  });

  it('rests advance time silently', () => {
    const { events, lengthBeats } = parseChannel('C4 - - E4 -');
    expect(events).toHaveLength(2);
    expect(events[1].timeBeats).toBe(3);
    expect(lengthBeats).toBe(5); // trailing rest counts toward the loop length
  });

  it('a dot after a rest extends the silence, not the note', () => {
    const { events, lengthBeats } = parseChannel('C4 - . E4');
    expect(events[0].durationBeats).toBe(1);
    expect(events[1].timeBeats).toBe(3);
    expect(lengthBeats).toBe(4);
  });

  it('rejects a dot before any note or rest', () => {
    expect(() => parseChannel('. C4')).toThrow(/token 1/);
  });

  it('validates bar lines against the beats-per-bar', () => {
    expect(() => parseChannel('C4 . . . | E4 - - -', 4)).not.toThrow();
    expect(() => parseChannel('C4 . . | E4', 4)).toThrow(/bar/i);
  });

  it('ignores newlines and extra spaces', () => {
    const { lengthBeats } = parseChannel('C4 .   E4\n G4 .');
    expect(lengthBeats).toBe(5);
  });

  it('reports the offending token on bad notes', () => {
    expect(() => parseChannel('C4 X9 E4')).toThrow(/token 2/);
  });
});

describe('secondsPerBeat', () => {
  it('converts BPM to seconds', () => {
    expect(secondsPerBeat(120)).toBeCloseTo(0.5);
    expect(secondsPerBeat(60)).toBe(1);
  });

  it('rejects nonsense tempos', () => {
    expect(() => secondsPerBeat(0)).toThrow();
    expect(() => secondsPerBeat(-10)).toThrow();
  });
});
