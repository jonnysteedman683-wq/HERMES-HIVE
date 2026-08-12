/**
 * requestLogger — Connect/Vite-compatible request logging middleware.
 *
 * Logs one line per HTTP request with:
 *   - HTTP method
 *   - request URL (path + query)
 *   - response status code
 *   - response time (ms)
 *   - a per-request correlation ID (echoed back on the `x-correlation-id`
 *     response header so clients can trace a request across the system)
 *
 * The correlation ID is also attached to `req` as `req.__correlationId` so
 * downstream handlers can thread it through logs and audit records.
 */
import type { Connect } from 'vite';

const DEFAULT_CORRELATION_HEADER = 'x-correlation-id';

export interface RequestLoggerOptions {
  /** Header used to read/emit the correlation ID. */
  correlationHeader?: string;
  /** Custom sink; defaults to console.log. */
  log?: (line: string) => void;
  /** When true, also log requests that never reach a status (aborted). */
  logAborted?: boolean;
}

function generateId(): string {
  // Prefer crypto.randomUUID when available (Node 14.17+).
  const g = (globalThis as { crypto?: { randomUUID?: () => string } }).crypto;
  if (g?.randomUUID) return g.randomUUID();
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

declare module 'http' {
  interface IncomingMessage {
    __correlationId?: string;
  }
}

export function requestLogger(options: RequestLoggerOptions = {}): Connect.NextHandleFunction {
  const correlationHeader = options.correlationHeader ?? DEFAULT_CORRELATION_HEADER;
  const log = options.log ?? ((line: string) => console.log(line));
  const logAborted = options.logAborted ?? true;

  return (req: Connect.IncomingMessage, res: any, next: Connect.NextFunction) => {
    const start = Date.now();

    const correlationId =
      (req.headers[correlationHeader] as string | undefined) || generateId();
    req.__correlationId = correlationId;
    // Echo the ID back so clients / downstream hops can correlate.
    if (!res.headersSent) {
      res.setHeader(correlationHeader, correlationId);
    }

    const method = req.method || 'GET';
    const url = req.url || '';

    let finished = false;
    const onDone = () => {
      if (finished) return;
      finished = true;
      res.removeListener('finish', onDone);
      res.removeListener('close', onDone);

      const durationMs = Date.now() - start;
      const statusCode = res.statusCode || 0;

      if (statusCode === 0) {
        if (!logAborted) return;
        log(`${correlationId} ${method} ${url} -> ABORTED (${durationMs}ms)`);
        return;
      }
      log(`${correlationId} ${method} ${url} -> ${statusCode} (${durationMs}ms)`);
    };

    res.on('finish', onDone);
    res.on('close', onDone);

    next();
  };
}
