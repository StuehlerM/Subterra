import { describe, expect, it } from 'vitest';
import { AppFlow, Screen } from '../src/app/AppFlow';

const SLOT_COUNT = 3;

describe('AppFlow screens', () => {
  it('boots on the title screen', () => {
    expect(new AppFlow(SLOT_COUNT).screen).toBe(Screen.Title);
  });

  it('confirm on the title opens the slot picker', () => {
    const flow = new AppFlow(SLOT_COUNT);
    flow.pressConfirm();
    expect(flow.screen).toBe(Screen.SlotSelect);
    expect(flow.slotCursor).toBe(0);
  });

  it('back on the slot picker returns to the title', () => {
    const flow = new AppFlow(SLOT_COUNT);
    flow.pressConfirm();
    flow.pressBack();
    expect(flow.screen).toBe(Screen.Title);
  });

  it('left/right move the slot cursor and wrap around', () => {
    const flow = new AppFlow(SLOT_COUNT);
    flow.pressConfirm();
    flow.navigate(1);
    flow.navigate(1);
    expect(flow.slotCursor).toBe(2);
    flow.navigate(1);
    expect(flow.slotCursor).toBe(0);
    flow.navigate(-1);
    expect(flow.slotCursor).toBe(2);
  });

  it('confirm on the slot picker starts playing the highlighted slot', () => {
    const flow = new AppFlow(SLOT_COUNT);
    flow.pressConfirm();
    flow.navigate(1);
    flow.pressConfirm();
    expect(flow.screen).toBe(Screen.Playing);
    expect(flow.slotCursor).toBe(1);
  });
});

describe('AppFlow title menu', () => {
  it('up/down move between start and options, clamped', () => {
    const flow = new AppFlow(SLOT_COUNT);
    expect(flow.titleCursor).toBe(0);
    flow.moveVertical(-1);
    expect(flow.titleCursor).toBe(0);
    flow.moveVertical(1);
    expect(flow.titleCursor).toBe(1);
    flow.moveVertical(1);
    expect(flow.titleCursor).toBe(1);
  });

  it('confirm opens the slot picker from START and options from OPTIONS', () => {
    const start = new AppFlow(SLOT_COUNT);
    start.pressConfirm();
    expect(start.screen).toBe(Screen.SlotSelect);

    const options = new AppFlow(SLOT_COUNT);
    options.moveVertical(1);
    options.pressConfirm();
    expect(options.screen).toBe(Screen.Options);
  });

  it('options: up/down move over the two entries and Z goes back', () => {
    const flow = new AppFlow(SLOT_COUNT);
    flow.moveVertical(1);
    flow.pressConfirm();
    expect(flow.optionsCursor).toBe(0);
    flow.moveVertical(1);
    expect(flow.optionsCursor).toBe(1);
    flow.moveVertical(1);
    expect(flow.optionsCursor).toBe(1);
    flow.pressBack();
    expect(flow.screen).toBe(Screen.Title);
  });
});

describe('AppFlow slot delete', () => {
  function pickerWithOccupied(occupied: boolean[]): AppFlow {
    const flow = new AppFlow(SLOT_COUNT);
    flow.updateOccupancy(occupied);
    flow.pressConfirm();
    return flow;
  }

  it('down on an occupied slot highlights DELETE; up returns', () => {
    const flow = pickerWithOccupied([true, false, false]);
    flow.moveVertical(1);
    expect(flow.onDeleteRow).toBe(true);
    flow.moveVertical(-1);
    expect(flow.onDeleteRow).toBe(false);
  });

  it('down on an empty slot does nothing', () => {
    const flow = pickerWithOccupied([false, false, false]);
    flow.moveVertical(1);
    expect(flow.onDeleteRow).toBe(false);
  });

  it('confirm on DELETE asks for confirmation; confirm again returns to picker', () => {
    const flow = pickerWithOccupied([true, false, false]);
    flow.moveVertical(1);
    flow.pressConfirm();
    expect(flow.screen).toBe(Screen.ConfirmDelete);
    flow.pressConfirm();
    expect(flow.screen).toBe(Screen.SlotSelect);
    expect(flow.onDeleteRow).toBe(false);
  });

  it('Z cancels the confirmation dialog', () => {
    const flow = pickerWithOccupied([true, false, false]);
    flow.moveVertical(1);
    flow.pressConfirm();
    flow.pressBack();
    expect(flow.screen).toBe(Screen.SlotSelect);
  });

  it('moving to another slot leaves the delete row', () => {
    const flow = pickerWithOccupied([true, true, false]);
    flow.moveVertical(1);
    flow.navigate(1);
    expect(flow.onDeleteRow).toBe(false);
    expect(flow.slotCursor).toBe(1);
  });

  it('never starts the game from the delete row', () => {
    const flow = pickerWithOccupied([true, false, false]);
    flow.moveVertical(1);
    flow.pressConfirm();
    expect(flow.screen).not.toBe(Screen.Playing);
  });
});

describe('AppFlow pause', () => {
  function playingFlow(): AppFlow {
    const flow = new AppFlow(SLOT_COUNT);
    flow.pressConfirm();
    flow.pressConfirm();
    return flow;
  }

  it('Esc toggles pause while playing', () => {
    const flow = playingFlow();
    flow.pressPause();
    expect(flow.screen).toBe(Screen.Paused);
    flow.pressPause();
    expect(flow.screen).toBe(Screen.Playing);
  });

  it('losing window focus pauses the game', () => {
    const flow = playingFlow();
    flow.windowBlurred();
    expect(flow.screen).toBe(Screen.Paused);
  });

  it('blur outside of play does not pause', () => {
    const flow = new AppFlow(SLOT_COUNT);
    flow.windowBlurred();
    expect(flow.screen).toBe(Screen.Title);
  });

  it('Esc does nothing outside of play', () => {
    const flow = new AppFlow(SLOT_COUNT);
    flow.pressPause();
    expect(flow.screen).toBe(Screen.Title);
    flow.pressConfirm();
    flow.pressPause();
    expect(flow.screen).toBe(Screen.SlotSelect);
  });

  it('only Esc resumes: confirm/back/nav stay paused', () => {
    const flow = playingFlow();
    flow.pressPause();
    flow.pressConfirm();
    flow.pressBack();
    flow.navigate(1);
    expect(flow.screen).toBe(Screen.Paused);
  });

  it('gameplay keys do not disturb the flow while playing', () => {
    const flow = playingFlow();
    flow.pressConfirm();
    flow.pressBack();
    flow.navigate(-1);
    expect(flow.screen).toBe(Screen.Playing);
    expect(flow.slotCursor).toBe(0);
  });
});
