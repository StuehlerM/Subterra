import { describe, expect, it } from 'vitest';
import { Tutorial, TUTORIAL_DONE, TutorialObservation } from '../src/app/onboarding/Tutorial';

const IDLE: TutorialObservation = {
  underground: false,
  hasOre: false,
  shopOpen: false,
  boughtSomething: false,
  depth: 0,
};

function obs(partial: Partial<TutorialObservation>): TutorialObservation {
  return { ...IDLE, ...partial };
}

describe('Tutorial steps', () => {
  it('starts by asking the player to dig', () => {
    const tutorial = new Tutorial(0);
    tutorial.update(obs({}));
    expect(tutorial.currentHintIndex()).toBe(0);
  });

  it('walks through dig, ore, sell, shop and goal in order', () => {
    const tutorial = new Tutorial(0);
    tutorial.update(obs({ underground: true }));
    expect(tutorial.currentHintIndex()).toBe(1);
    tutorial.update(obs({ underground: true, hasOre: true }));
    expect(tutorial.currentHintIndex()).toBe(2);
    tutorial.update(obs({ shopOpen: true }));
    expect(tutorial.currentHintIndex()).toBe(3);
    tutorial.update(obs({ shopOpen: true, boughtSomething: true }));
    expect(tutorial.currentHintIndex()).toBe(4);
    tutorial.update(obs({ underground: true, depth: 5 }));
    expect(tutorial.currentHintIndex()).toBeNull();
    expect(tutorial.step).toBe(TUTORIAL_DONE);
  });

  it('also leaves the shop step when the menu closes without a purchase', () => {
    const tutorial = new Tutorial(3);
    tutorial.update(obs({ shopOpen: true }));
    expect(tutorial.currentHintIndex()).toBe(3);
    tutorial.update(obs({ shopOpen: false }));
    expect(tutorial.currentHintIndex()).toBe(4);
  });

  it('does not skip steps on wild states', () => {
    const tutorial = new Tutorial(0);
    tutorial.update(obs({ hasOre: true, depth: 9 })); // never went underground?
    expect(tutorial.currentHintIndex()).toBe(1); // one step at a time
  });

  it('a finished tutorial stays silent forever', () => {
    const tutorial = new Tutorial(TUTORIAL_DONE);
    tutorial.update(obs({ underground: true, hasOre: true, depth: 20 }));
    expect(tutorial.currentHintIndex()).toBeNull();
  });

  it('resumes from a saved step', () => {
    const tutorial = new Tutorial(2);
    tutorial.update(obs({}));
    expect(tutorial.currentHintIndex()).toBe(2);
  });

  it('clamps corrupt step values', () => {
    expect(new Tutorial(99).currentHintIndex()).toBeNull();
    const negative = new Tutorial(-3);
    negative.update(obs({}));
    expect(negative.currentHintIndex()).toBe(0);
  });
});
