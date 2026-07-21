import { InstrumentName } from './instruments';

/**
 * The background music, written as text (see notation.ts). Three mild loops:
 * a calm title theme, a light mining theme, and a sparse deep-cave ambience.
 * Editing the soundtrack = editing these strings.
 */

export interface ChannelDefinition {
  readonly instrument: InstrumentName;
  readonly notes: string;
}

export interface TrackDefinition {
  readonly bpm: number;
  readonly beatsPerBar: number;
  readonly channels: readonly ChannelDefinition[];
}

const TITLE: TrackDefinition = {
  bpm: 90,
  beatsPerBar: 4,
  channels: [
    {
      instrument: 'pad',
      notes: `C3 . . . | A2 . . . | F2 . . . | G2 . . . |
              C3 . . . | A2 . . . | F2 . . . | G2 . . . |`,
    },
    {
      instrument: 'lead',
      notes: `E4 . G4 . | C4 . E4 . | A3 . C4 . | B3 . D4 . |
              E4 . G4 . | C5 . B4 . | A4 . F4 . | G4 . . - |`,
    },
  ],
};

const MINING: TrackDefinition = {
  bpm: 110,
  beatsPerBar: 4,
  channels: [
    {
      instrument: 'bass',
      notes: `C3 - G2 - | C3 - G2 - | F2 - C3 - | G2 - D3 - |
              C3 - G2 - | C3 - G2 - | F2 - C3 - | G2 - D3 - |`,
    },
    {
      instrument: 'lead',
      notes: `E4 G4 . C5 | . B4 G4 E4 | F4 A4 . C5 | . D5 B4 G4 |
              E4 G4 . C5 | . E5 D5 C5 | A4 F4 A4 C5 | B4 G4 . . |`,
    },
    {
      instrument: 'tick',
      notes: `C6 - C6 - | C6 - C6 - | C6 - C6 - | C6 - C6 - |
              C6 - C6 - | C6 - C6 - | C6 - C6 - | C6 - C6 - |`,
    },
  ],
};

const DEEP: TrackDefinition = {
  bpm: 70,
  beatsPerBar: 4,
  channels: [
    {
      instrument: 'pad',
      notes: `A2 . . . | . . . . | F2 . . . | . . . . |
              E2 . . . | . . . . | A2 . . . | . . . . |`,
    },
    {
      instrument: 'lead',
      notes: `- - E4 - | - - - - | - A3 - - | - - C4 - |
              - - B3 - | - - - - | - E4 - - | - - - - |`,
    },
  ],
};

export const MUSIC: Record<string, TrackDefinition> = {
  title: TITLE,
  mining: MINING,
  deep: DEEP,
};
