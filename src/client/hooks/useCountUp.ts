import { useEffect, useRef, useState } from 'react';

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
      const t = Math.min((now - startTime) / durationMs, 1);
      // ease-out cubic
      const eased = 1 - Math.pow(1 - t, 3);
      const v = start + delta * eased;
      setValue(v);
      if (t < 1) {
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
