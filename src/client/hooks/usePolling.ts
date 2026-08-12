import { useEffect, useRef } from 'react';
import { createPollLoop } from '../utils/pollLoop';

/**
 * Poll a fetch/refresh function on an interval.
 *
 * The latest callback is kept in a ref and the loop subscribes ONCE, so
 * components with either `[]` deps or `[load]` deps (useCallback) behave
 * identically without re-subscribing on every render. The original `[]`-deps
 * pattern captured the first render's closure forever; this always calls the
 * fresh closure.
 *
 * Overlapping polls are impossible: if a previous invocation is still pending
 * when a tick fires, the tick is skipped (no request stacking, no stale-wins).
 * Throws and rejections are logged by the loop and never escape as unhandled
 * rejections.
 */
export function usePolling(
  fetchFn: () => void | Promise<void>,
  intervalMs: number,
  immediate = true
): void {
  const fnRef = useRef(fetchFn);

  useEffect(() => {
    fnRef.current = fetchFn;
  });

  useEffect(() => {
    const loop = createPollLoop(() => fnRef.current(), intervalMs, { immediate });
    loop.start();
    return () => loop.stop();
  }, [intervalMs, immediate]);
}
