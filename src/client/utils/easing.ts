/** Cubic ease-out with the input clamped to [0, 1]. easeOutCubic(0) = 0, easeOutCubic(1) = 1. */
export function easeOutCubic(t: number): number {
  const x = Math.min(Math.max(t, 0), 1);
  return 1 - Math.pow(1 - x, 3);
}
