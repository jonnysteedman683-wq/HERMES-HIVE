/**
 * Standalone task-worker process — the distributed-execution half of the
 * task queue.
 *
 * The dev server boots one in-process TaskWorker (src/server/apiMiddleware.ts)
 * so queued tasks execute locally, but that worker dies with the server and
 * caps throughput at one Node process. This entry point lets you spawn
 * additional workers against the same SQLite store (WAL mode allows
 * multi-process readers/writers) — on the same host or another machine that
 * shares the database file — turning the queue into a horizontally scalable
 * execution layer.
 *
 * Usage:
 *   npm run worker
 *   (or, for the exact same thing under node:)
 *   node node_modules/tsx/dist/cli.mjs src/server/tasks/workerMain.ts
 *
 * Env:
 *   HERMES_WORKER_CONCURRENCY  max parallel tasks  (default 4)
 *   HERMES_WORKER_POLL_MS      queue poll interval (default 500)
 *   HERMES_WORKER_KINDS        comma-separated task kinds to accept
 *                              (default: agent_llm, agent_tool, tool_execute, hermes_command)
 *
 * The worker opens the SQLite DB relative to the working directory — run it
 * from the repo root (or wherever the target .hive/ lives) so it consumes
 * the same queue as the dashboard.
 *
 * Shutdown: SIGINT/SIGTERM drain in-flight tasks (up to 30s), then exit 0.
 */
import { TaskWorker } from './taskWorker';

function parseKinds(raw: string | undefined): string[] | undefined {
  if (!raw) return undefined;
  const kinds = raw
    .split(',')
    .map((k) => k.trim())
    .filter(Boolean);
  return kinds.length > 0 ? kinds : undefined;
}

const concurrency = Number(process.env.HERMES_WORKER_CONCURRENCY) || 4;
const pollIntervalMs = Number(process.env.HERMES_WORKER_POLL_MS) || 500;
const taskKinds = parseKinds(process.env.HERMES_WORKER_KINDS);

const worker = new TaskWorker({ concurrency, pollIntervalMs, taskKinds });

let shuttingDown = false;
async function shutdown(signal: string): Promise<void> {
  if (shuttingDown) return;
  shuttingDown = true;
  console.log(
    `[workerMain] ${signal} received — draining in-flight tasks (max 30s)`
  );
  try {
    await worker.stop();
  } catch (err) {
    console.error('[workerMain] error during drain:', err);
  }
  process.exit(0);
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

// A stray rejection must not silently kill a daemon mid-task.
process.on('unhandledRejection', (reason) => {
  console.error('[workerMain] unhandled rejection:', reason);
});

console.log(
  `[workerMain] booting worker pid=${process.pid} concurrency=${concurrency} ` +
    `poll=${pollIntervalMs}ms kinds=[${(taskKinds ?? []).join(', ') || 'default'}] ` +
    `cwd=${process.cwd()}`
);

worker.start();
