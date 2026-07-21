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
