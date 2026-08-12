/**
 * Framework-free poll loop with an in-flight guard.
 *
 * Fires `run` immediately (unless `immediate: false`) and then every
 * `intervalMs`. If a previous invocation is still pending (its promise
 * unresolved) when a tick fires, the tick is SKIPPED instead of stacking
 * overlapping requests — polling a slow endpoint can never build up a
 * backlog, and a slow response can never overwrite a fresher one
 * (stale-wins race).
 *
 * Synchronous throws and promise rejections are logged and the loop keeps
 * running, so one bad tick cannot kill the poller or escape as an unhandled
 * rejection.
 */
export interface PollLoop {
  start: () => void;
  stop: () => void;
}

export function createPollLoop(
  run: () => void | Promise<void>,
  intervalMs: number,
  options: { immediate?: boolean } = {}
): PollLoop {
  const { immediate = true } = options;
  let timer: ReturnType<typeof setInterval> | null = null;
  let inFlight = false;

  const invoke = (): void => {
    if (inFlight) return; // previous call still running — skip, don't stack
    let result: void | Promise<void>;
    try {
      result = run();
    } catch (err) {
      console.error('[pollLoop] poll callback threw:', err);
      return;
    }
    if (result && typeof (result as Promise<void>).then === 'function') {
      inFlight = true;
      (result as Promise<void>).then(
        () => {
          inFlight = false;
        },
        (err) => {
          inFlight = false;
          console.error('[pollLoop] poll callback rejected:', err);
        }
      );
    }
  };

  return {
    start: () => {
      if (timer !== null) return; // idempotent
      if (immediate) invoke();
      timer = setInterval(invoke, intervalMs);
    },
    stop: () => {
      if (timer !== null) {
        clearInterval(timer);
        timer = null;
      }
    },
  };
}
