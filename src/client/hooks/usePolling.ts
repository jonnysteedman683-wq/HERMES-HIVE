import { useEffect, useRef } from 'react';

/**
 * Poll a fetch/refresh function on an interval.
 *
 * The latest callback is kept in a ref and the interval subscribes ONCE,
 * so components with either `[]` deps or `[load]` deps (useCallback) behave
 * identically without re-subscribing on every render. The original `[]`-deps
 * pattern captured the first render's closure forever; this always calls the
 * fresh closure.
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
    if (immediate) fnRef.current();
    const id = setInterval(() => {
      void fnRef.current();
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs, immediate]);
}
