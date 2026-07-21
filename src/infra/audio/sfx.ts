import { ChannelDefinition } from './tracks';

/**
 * Every sound effect, written as short bursts of the same text notation.
 * Noise instruments use the note's pitch as their filter colour, so "C2" is
 * a low rumble and "C6" a crisp tap. Ore chimes rise with the ore's rarity.
 */

export interface SfxDefinition {
  readonly bpm: number;
  readonly channels: readonly ChannelDefinition[];
}

function sfx(bpm: number, instrument: string, notes: string): SfxDefinition {
  return { bpm, channels: [{ instrument, notes }] };
}

export const SFX: Record<string, SfxDefinition> = {
  walk: sfx(480, 'tick', 'C6'),
  drill: sfx(480, 'grind', 'C2 C2'),
  sell: sfx(360, 'chime', 'E5 G5 C6'),
  upgrade: sfx(360, 'chime', 'C4 E4 G4 C5 E5'),
  menu_move: sfx(480, 'blip', 'C6'),
  menu_confirm: sfx(480, 'blip', 'G5 C6'),
  menu_open: sfx(360, 'chime', 'C5 G5'),
  dynamite_place: sfx(480, 'blip', 'C3'),
  explosion: sfx(240, 'boom', 'C1 . .'),
  flare: sfx(240, 'air', 'C2 .'),
  bat_wake: sfx(360, 'spook', 'F#5 C5'),
  knockout: sfx(300, 'spook', 'C4 G3 E3 C3'),
  portal: sfx(480, 'chime', 'C5 E5 G5 C6 G5 E5 C5'),
  ore_coal: sfx(360, 'chime', 'C4 E4'),
  ore_copper: sfx(360, 'chime', 'D4 F#4'),
  ore_iron: sfx(360, 'chime', 'E4 G4'),
  ore_silver: sfx(360, 'chime', 'G4 B4'),
  ore_gold: sfx(360, 'chime', 'A4 C#5 E5'),
  ore_gem: sfx(360, 'chime', 'C5 E5 G5 C6'),
};
