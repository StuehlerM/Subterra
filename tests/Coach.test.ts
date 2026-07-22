import { describe, expect, it } from 'vitest';
import {
  Coach,
  CoachObservation,
  COACH_BAT_MAX,
  COACH_BAT_MIN,
  COACH_SHOW_MS,
} from '../src/app/onboarding/Coach';

const IDLE: CoachObservation = {
  underground: true,
  blockingRock: null,
  dynamiteRemaining: 3,
  nearestBat: null,
  flareRemaining: 2,
  cargoFull: false,
  batteryEmpty: false,
  nearestPortal: null,
};

function obs(partial: Partial<CoachObservation>): CoachObservation {
  return { ...IDLE, ...partial };
}

const BAND = Math.round((COACH_BAT_MIN + COACH_BAT_MAX) / 2);

describe('Coach — contextual, learn-once hints', () => {
  it('teaches dynamite the first time a rock blocks the way (only with dynamite)', () => {
    // supplyEmpty pre-learned so the empty-dynamite case isolates the rock rule.
    expect(
      new Coach(['supplyEmpty']).update(obs({ blockingRock: { x: 4, y: 9 }, dynamiteRemaining: 0 }), 0),
    ).toBeNull();
    expect(new Coach().update(obs({ blockingRock: { x: 4, y: 9 }, dynamiteRemaining: 2 }), 0)).toEqual({
      lesson: 'rock',
      target: { kind: 'tile', x: 4, y: 9 },
    });
  });

  it('teaches the flare only when a bat is in the near band and a flare is held', () => {
    const near = { x: 10, y: 12 };
    expect(
      new Coach().update(obs({ nearestBat: { ...near, distance: COACH_BAT_MIN - 1 }, flareRemaining: 1 }), 0),
      'too close',
    ).toBeNull();
    expect(
      new Coach().update(obs({ nearestBat: { ...near, distance: COACH_BAT_MAX + 1 }, flareRemaining: 1 }), 0),
      'too far',
    ).toBeNull();
    expect(
      new Coach(['supplyEmpty']).update(obs({ nearestBat: { ...near, distance: BAND }, flareRemaining: 0 }), 0),
      'no flare',
    ).toBeNull();
    expect(
      new Coach().update(obs({ nearestBat: { ...near, distance: BAND }, flareRemaining: 1 }), 0),
    ).toEqual({ lesson: 'bat', target: { kind: 'entity', x: 10, y: 12 } });
  });

  it('teaches restock when EITHER dynamite or flares runs out', () => {
    const supplyCue = { lesson: 'supplyEmpty', target: { kind: 'hud', element: 'supply' } };
    expect(new Coach().update(obs({ dynamiteRemaining: 0 }), 0)).toEqual(supplyCue);
    expect(new Coach().update(obs({ flareRemaining: 0 }), 0)).toEqual(supplyCue);
    expect(new Coach().update(obs({ dynamiteRemaining: 1, flareRemaining: 1 }), 0)).toBeNull();
  });

  it('teaches portals when one is within reach, highlighting it', () => {
    expect(new Coach().update(obs({ nearestPortal: { x: 8, y: 20, distance: 4 } }), 0)).toEqual({
      lesson: 'portal',
      target: { kind: 'tile', x: 8, y: 20 },
    });
    expect(new Coach().update(obs({ nearestPortal: { x: 8, y: 20, distance: 99 } }), 0)).toBeNull();
  });

  it('teaches full cargo and empty battery, pointing at their HUD gauges', () => {
    expect(new Coach().update(obs({ cargoFull: true }), 0)).toEqual({
      lesson: 'cargoFull',
      target: { kind: 'hud', element: 'cargo' },
    });
    expect(new Coach().update(obs({ batteryEmpty: true }), 0)).toEqual({
      lesson: 'batteryEmpty',
      target: { kind: 'hud', element: 'battery' },
    });
  });

  it('shows danger first: rock over bat over battery', () => {
    // Bat needs a flare in hand, so this group keeps supplies stocked.
    const danger = obs({
      blockingRock: { x: 1, y: 1 },
      dynamiteRemaining: 1,
      nearestBat: { x: 2, y: 2, distance: BAND },
      flareRemaining: 1,
      batteryEmpty: true,
    });
    expect(new Coach().update(danger, 0)?.lesson).toBe('rock');
    expect(new Coach(['rock']).update(danger, 0)?.lesson).toBe('bat');
    expect(new Coach(['rock', 'bat']).update(danger, 0)?.lesson).toBe('batteryEmpty');
  });

  it('orders logistics: battery over supply over cargo over portal', () => {
    const logistics = obs({
      batteryEmpty: true,
      flareRemaining: 0, // a supply is out
      cargoFull: true,
      nearestPortal: { x: 3, y: 3, distance: 4 },
    });
    expect(new Coach().update(logistics, 0)?.lesson).toBe('batteryEmpty');
    expect(new Coach(['batteryEmpty']).update(logistics, 0)?.lesson).toBe('supplyEmpty');
    expect(new Coach(['batteryEmpty', 'supplyEmpty']).update(logistics, 0)?.lesson).toBe('cargoFull');
    expect(
      new Coach(['batteryEmpty', 'supplyEmpty', 'cargoFull']).update(logistics, 0)?.lesson,
    ).toBe('portal');
  });

  it('keeps the highlight following the hazard while shown, even if it moves off-screen', () => {
    const coach = new Coach();
    coach.update(obs({ nearestBat: { x: 5, y: 5, distance: BAND }, flareRemaining: 1 }), 0);
    // Bat gone from observation this frame: the cue keeps the last known target.
    const cue = coach.update(obs({ nearestBat: null, flareRemaining: 1 }), 100);
    expect(cue).toEqual({ lesson: 'bat', target: { kind: 'entity', x: 5, y: 5 } });
  });

  it('shows a lesson once, then never again (learn-once)', () => {
    const coach = new Coach();
    const rock = obs({ blockingRock: { x: 4, y: 9 }, dynamiteRemaining: 2 });
    expect(coach.update(rock, 0)?.lesson).toBe('rock');
    expect(coach.update(rock, COACH_SHOW_MS)).toBeNull(); // display window elapsed
    expect(coach.learnedIds()).toContain('rock');
    expect(coach.update(rock, 0)).toBeNull(); // stays silent forever
  });

  it('does not coach above ground', () => {
    const coach = new Coach();
    expect(
      coach.update(obs({ underground: false, batteryEmpty: true, cargoFull: true, flareRemaining: 0 }), 0),
    ).toBeNull();
  });

  it('resumes learned lessons from a saved set and reports them', () => {
    const coach = new Coach(['rock', 'bogus']);
    expect(coach.update(obs({ blockingRock: { x: 0, y: 0 }, dynamiteRemaining: 1 }), 0)).toBeNull();
    expect(coach.learnedIds()).toEqual(['rock']); // unknown ids dropped
  });
});
