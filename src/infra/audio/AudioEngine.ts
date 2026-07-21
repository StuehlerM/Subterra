import { INSTRUMENTS } from './instruments';
import { MuteStore } from './MuteStore';
import { parseChannel, ParsedChannel, secondsPerBeat } from './notation';
import { SFX } from './sfx';
import { Synth } from './Synth';
import { MUSIC, TrackDefinition } from './tracks';

const MASTER_VOLUME = 0.6;
const MUSIC_VOLUME = 0.3;
const SFX_VOLUME = 0.9;
/** How far ahead the loop scheduler keeps the music queued. */
const LOOKAHEAD_SECONDS = 0.6;
const SCHEDULER_INTERVAL_MS = 200;
const TRACK_FADE_SECONDS = 0.4;

interface PreparedChannel {
  readonly parsed: ParsedChannel;
  readonly instrument: string;
}

/**
 * The audio facade: bakes notation once (like the sprite baker), then plays
 * SFX on demand and keeps one music loop scheduled ahead of the clock.
 * Everything runs through a master gain so the M key can mute the world.
 */
export class AudioEngine {
  private ctx: AudioContext | null = null;
  private synth: Synth | null = null;
  private master: GainNode | null = null;
  private musicBus: GainNode | null = null;
  private sfxBus: GainNode | null = null;
  private currentTrack: string | null = null;
  private loopTimer: number | null = null;

  constructor(private readonly muteStore: MuteStore) {}

  /** Creates/resumes the context. Must be called from a user gesture. */
  unlock(): void {
    if (!this.ctx) {
      this.ctx = new AudioContext();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muteStore.muted ? 0 : MASTER_VOLUME;
      this.master.connect(this.ctx.destination);
      this.musicBus = this.ctx.createGain();
      this.musicBus.gain.value = MUSIC_VOLUME;
      this.musicBus.connect(this.master);
      this.sfxBus = this.ctx.createGain();
      this.sfxBus.gain.value = SFX_VOLUME;
      this.sfxBus.connect(this.master);
      this.synth = new Synth(this.ctx);
    }
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  get muted(): boolean {
    return this.muteStore.muted;
  }

  toggleMuted(): boolean {
    const muted = this.muteStore.toggle();
    if (this.ctx && this.master) {
      this.master.gain.setTargetAtTime(muted ? 0 : MASTER_VOLUME, this.ctx.currentTime, 0.02);
    }
    return muted;
  }

  playSfx(name: string): void {
    if (!this.ctx || !this.synth || !this.sfxBus) return;
    const definition = SFX[name];
    if (!definition) throw new Error(`Unknown sound effect '${name}'`);
    const spb = secondsPerBeat(definition.bpm);
    for (const channel of definition.channels) {
      this.synth.schedule(
        parseChannel(channel.notes).events,
        INSTRUMENTS[channel.instrument],
        this.ctx.currentTime,
        spb,
        this.sfxBus,
      );
    }
  }

  /** Switches the looping background track (no-op when already playing). */
  playMusic(name: string): void {
    if (name === this.currentTrack) return;
    const track = MUSIC[name];
    if (!track) throw new Error(`Unknown music track '${name}'`);
    this.currentTrack = name;
    if (!this.ctx) return; // not unlocked yet: remembered and started on unlock
    this.restartLoop(track);
  }

  /** Called every frame; lazily starts the pending track once unlocked. */
  keepPlaying(): void {
    if (this.ctx && this.currentTrack && this.loopTimer === null) {
      this.restartLoop(MUSIC[this.currentTrack]);
    }
  }

  private restartLoop(track: TrackDefinition): void {
    if (!this.ctx || !this.musicBus) return;
    if (this.loopTimer !== null) {
      window.clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    // Fade the old bus content out by swapping in a fresh music bus.
    const oldBus = this.musicBus;
    oldBus.gain.setTargetAtTime(0, this.ctx.currentTime, TRACK_FADE_SECONDS / 4);
    window.setTimeout(() => oldBus.disconnect(), TRACK_FADE_SECONDS * 1000);
    this.musicBus = this.ctx.createGain();
    this.musicBus.gain.value = MUSIC_VOLUME;
    this.musicBus.connect(this.master!);

    const spb = secondsPerBeat(track.bpm);
    const channels: PreparedChannel[] = track.channels.map((c) => ({
      parsed: parseChannel(c.notes, track.beatsPerBar),
      instrument: c.instrument,
    }));
    const loopSeconds = channels[0].parsed.lengthBeats * spb;
    let nextLoopStart = this.ctx.currentTime + 0.1;

    const scheduleAhead = () => {
      if (!this.ctx || !this.synth || !this.musicBus) return;
      while (nextLoopStart < this.ctx.currentTime + LOOKAHEAD_SECONDS + loopSeconds) {
        for (const channel of channels) {
          this.synth.schedule(
            channel.parsed.events,
            INSTRUMENTS[channel.instrument],
            nextLoopStart,
            spb,
            this.musicBus,
          );
        }
        nextLoopStart += loopSeconds;
      }
    };
    scheduleAhead();
    this.loopTimer = window.setInterval(scheduleAhead, SCHEDULER_INTERVAL_MS);
  }
}
