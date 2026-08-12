import { useEffect, useRef } from 'react';

/**
 * Runs a fetch/data-loading callback immediately and re-runs it on a fixed
 * interval (polling). The latest callback is always invoked (ref-based), so
 * the effect never re-subscribes on re-renders and stale closures are avoided.
 *
 * @param fetchFn   Async (or sync) data-loading function. Return value ignored.
 * @param intervalMs Poll interval in milliseconds.
 * @param immediate Whether to run `fetchFn` once immediately (default true).
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
