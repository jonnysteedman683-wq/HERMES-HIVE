import { describe, it, expect } from 'vitest';
import { easeOutCubic } from '../client/utils/easing';

describe('easeOutCubic', () => {
  it('hits the endpoints', () => {
    expect(easeOutCubic(0)).toBe(0);
    expect(easeOutCubic(1)).toBe(1);
  });

  it('is monotonic non-decreasing on [0, 1]', () => {
    let prev = -Infinity;
    for (let i = 0; i <= 100; i++) {
      const v = easeOutCubic(i / 100);
      expect(v).toBeGreaterThanOrEqual(prev);
      prev = v;
    }
  });

  it('clamps out-of-range inputs', () => {
    expect(easeOutCubic(-1)).toBe(0);
    expect(easeOutCubic(2)).toBe(1);
  });
});
