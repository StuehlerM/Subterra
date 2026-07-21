import { Instrument } from './instruments';
import { NoteEvent } from './notation';

const NOISE_BUFFER_SECONDS = 1;
const NOISE_FILTER_Q = 1.2;

/**
 * The only WebAudio-touching voice code: turns parsed note events into
 * scheduled oscillator/noise voices with attack/release envelopes. Everything
 * musical (what to play, when) was decided by the pure notation layer.
 */
export class Synth {
  private noiseBuffer: AudioBuffer | null = null;

  constructor(private readonly ctx: AudioContext) {}

  /** Schedules a channel's events, starting at `when` (context time). */
  schedule(
    events: readonly NoteEvent[],
    instrument: Instrument,
    when: number,
    secondsPerBeat: number,
    destination: AudioNode,
  ): void {
    for (const event of events) {
      const start = when + event.timeBeats * secondsPerBeat;
      const stop = start + event.durationBeats * secondsPerBeat;
      this.voice(instrument, event.freq, start, stop, destination);
    }
  }

  private voice(inst: Instrument, freq: number, start: number, stop: number, out: AudioNode): void {
    const envelope = this.ctx.createGain();
    envelope.gain.setValueAtTime(0, start);
    envelope.gain.linearRampToValueAtTime(inst.volume, start + inst.attack);
    envelope.gain.setValueAtTime(inst.volume, Math.max(stop, start + inst.attack));
    envelope.gain.linearRampToValueAtTime(0, stop + inst.release);
    envelope.connect(out);

    const source = inst.wave === 'noise' ? this.noiseVoice(freq, envelope) : this.toneVoice(inst, freq, envelope);
    source.start(start);
    source.stop(stop + inst.release);
  }

  private toneVoice(inst: Instrument, freq: number, out: AudioNode): AudioScheduledSourceNode {
    const osc = this.ctx.createOscillator();
    osc.type = inst.wave as OscillatorType;
    osc.frequency.value = freq;
    osc.connect(out);
    return osc;
  }

  /** Noise coloured by the note's pitch (band-pass), so C2 rumbles, C6 taps. */
  private noiseVoice(freq: number, out: AudioNode): AudioScheduledSourceNode {
    const source = this.ctx.createBufferSource();
    source.buffer = this.noise();
    source.loop = true;
    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.value = freq;
    filter.Q.value = NOISE_FILTER_Q;
    source.connect(filter);
    filter.connect(out);
    return source;
  }

  private noise(): AudioBuffer {
    if (!this.noiseBuffer) {
      const length = Math.floor(this.ctx.sampleRate * NOISE_BUFFER_SECONDS);
      this.noiseBuffer = this.ctx.createBuffer(1, length, this.ctx.sampleRate);
      const data = this.noiseBuffer.getChannelData(0);
      for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
    }
    return this.noiseBuffer;
  }
}
