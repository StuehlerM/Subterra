import { describe, expect, it } from 'vitest';
import { filledUnits, gaugeColor } from '../../src/infra/ui/gauge';

const UNITS = 8;

describe('filledUnits', () => {
  it('is empty at zero and full at capacity', () => {
    expect(filledUnits(0, 10, UNITS)).toBe(0);
    expect(filledUnits(10, 10, UNITS)).toBe(UNITS);
  });

  it('shows at least one unit for any non-zero charge', () => {
    expect(filledUnits(1, 1000, UNITS)).toBe(1);
  });

  it('never looks full below capacity', () => {
    expect(filledUnits(999, 1000, UNITS)).toBe(UNITS - 1);
  });

  it('scales proportionally in between', () => {
    expect(filledUnits(5, 10, UNITS)).toBe(4);
  });

  it('handles a zero-capacity gauge gracefully', () => {
    expect(filledUnits(0, 0, UNITS)).toBe(0);
  });
});

describe('gaugeColor', () => {
  it('is green when comfortably charged', () => {
    expect(gaugeColor(1)).toBe('#57c04a');
    expect(gaugeColor(0.6)).toBe('#57c04a');
  });

  it('turns yellow when getting low', () => {
    expect(gaugeColor(0.5)).toBe('#ffcf3f');
    expect(gaugeColor(0.25)).toBe('#ffcf3f');
  });

  it('turns red when nearly empty', () => {
    expect(gaugeColor(0.2)).toBe('#e04a3a');
    expect(gaugeColor(0)).toBe('#e04a3a');
  });
});
