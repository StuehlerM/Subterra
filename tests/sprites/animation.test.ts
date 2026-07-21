import { describe, expect, it } from 'vitest';
import { frameIndexAt } from '../../src/infra/sprites/animation';

const FRAME_MS = 250;

describe('frameIndexAt', () => {
  it('starts at frame 0', () => {
    expect(frameIndexAt(0, 2, FRAME_MS)).toBe(0);
  });

  it('advances one frame per duration and wraps around', () => {
    expect(frameIndexAt(FRAME_MS, 2, FRAME_MS)).toBe(1);
    expect(frameIndexAt(FRAME_MS * 2, 2, FRAME_MS)).toBe(0);
    expect(frameIndexAt(FRAME_MS * 7, 3, FRAME_MS)).toBe(1);
  });

  it('holds frame 0 for single-frame sprites', () => {
    expect(frameIndexAt(12345, 1, FRAME_MS)).toBe(0);
  });

  it('never returns a negative frame for odd clock values', () => {
    expect(frameIndexAt(-FRAME_MS, 2, FRAME_MS)).toBe(1);
  });
});
