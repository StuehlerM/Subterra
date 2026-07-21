/** Pure animation timing (no DOM) so it stays unit-testable. */

/** Which frame a looping animation shows at a given clock time. */
export function frameIndexAt(timeMs: number, frameCount: number, frameDurationMs: number): number {
  if (frameCount <= 1) return 0;
  const step = Math.floor(timeMs / frameDurationMs);
  return ((step % frameCount) + frameCount) % frameCount;
}
