import { useEffect, useRef, useState } from 'react';
import { easeOutCubic } from '../utils/easing';

/**
 * useCountUp — animates a number from 0 (or `from`) to `target` with an
 * ease-out cubic curve. Re-runs whenever `target` changes. Returns the
 * current animated value (float — format with Math.round/toLocaleString).
 */
export function useCountUp(target: number, durationMs = 900, from = 0): number {
  const [value, setValue] = useState(from);
  const fromRef = useRef(from);
  const rafRef = useRef(0);

  useEffect(() => {
    const start = fromRef.current;
    const startTime = performance.now();
    const delta = target - start;

    if (delta === 0) {
      setValue(target);
      return;
    }

    const tick = (now: number) => {
      const t = (now - startTime) / durationMs;
      const v = start + delta * easeOutCubic(t);
      setValue(v);
      if (t < 1) {
        // Keep the next animation's start in sync so an interrupted animation
        // continues from the current value instead of jumping back to `from`.
        fromRef.current = v;
        rafRef.current = requestAnimationFrame(tick);
      } else {
        fromRef.current = target;
      }
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [target, durationMs]);

  return value;
}
