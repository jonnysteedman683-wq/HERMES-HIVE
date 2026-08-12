import { describe, it, expect, vi, afterEach } from 'vitest';
import { createPollLoop } from '../client/utils/pollLoop';

afterEach(() => {
  vi.useRealTimers();
});

describe('createPollLoop', () => {
  it('fires immediately when immediate=true (default)', () => {
    vi.useFakeTimers();
    const run = vi.fn();
    const loop = createPollLoop(run, 1000);
    loop.start();
    expect(run).toHaveBeenCalledTimes(1);
    loop.stop();
  });

  it('skips the immediate fire when immediate=false', () => {
    vi.useFakeTimers();
    const run = vi.fn();
    const loop = createPollLoop(run, 1000, { immediate: false });
    loop.start();
    expect(run).not.toHaveBeenCalled();
    loop.stop();
  });

  it('fires on each interval tick', () => {
    vi.useFakeTimers();
    const run = vi.fn();
    const loop = createPollLoop(run, 1000);
    loop.start();
    vi.advanceTimersByTime(3000);
    expect(run).toHaveBeenCalledTimes(4); // immediate + 3 ticks
    loop.stop();
  });

  it('skips ticks while a previous invocation is still in flight', async () => {
    vi.useFakeTimers();
    let resolveRun: () => void = () => {};
    const run = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          resolveRun = resolve;
        })
    );
    const loop = createPollLoop(run, 1000);
    loop.start(); // immediate call is now in flight
    expect(run).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(5000); // 5 ticks must all be skipped
    expect(run).toHaveBeenCalledTimes(1);

    resolveRun(); // settle the in-flight call
    await Promise.resolve(); // let the guard clear
    vi.advanceTimersByTime(1000);
    expect(run).toHaveBeenCalledTimes(2);
    loop.stop();
  });

  it('clears the guard and keeps polling after a rejected invocation', async () => {
    vi.useFakeTimers();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    let rejectRun: (err: unknown) => void = () => {};
    const run = vi.fn(
      () =>
        new Promise<void>((_, reject) => {
          rejectRun = reject;
        })
    );
    const loop = createPollLoop(run, 1000);
    loop.start();
    rejectRun(new Error('boom'));
    await Promise.resolve();
    vi.advanceTimersByTime(1000);
    expect(run).toHaveBeenCalledTimes(2);
    loop.stop();
    consoleSpy.mockRestore();
  });

  it('survives a synchronous throw and keeps polling', () => {
    vi.useFakeTimers();
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const run = vi.fn(() => {
      throw new Error('sync boom');
    });
    const loop = createPollLoop(run, 1000);
    loop.start();
    vi.advanceTimersByTime(2000);
    expect(run).toHaveBeenCalledTimes(3);
    loop.stop();
    consoleSpy.mockRestore();
  });

  it('stop() halts further ticks', () => {
    vi.useFakeTimers();
    const run = vi.fn();
    const loop = createPollLoop(run, 1000);
    loop.start();
    loop.stop();
    vi.advanceTimersByTime(5000);
    expect(run).toHaveBeenCalledTimes(1); // only the immediate call
  });

  it('start() is idempotent', () => {
    vi.useFakeTimers();
    const run = vi.fn();
    const loop = createPollLoop(run, 1000);
    loop.start();
    loop.start();
    expect(run).toHaveBeenCalledTimes(1);
    loop.stop();
  });
});
