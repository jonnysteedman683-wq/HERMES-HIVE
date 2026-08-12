const FALLBACK = '—';

function toDate(ts?: string | null): Date | null {
  if (!ts) return null;
  const d = new Date(ts);
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Time-only formatting (e.g. "3:45:12 PM"). Returns '—' for missing/invalid timestamps. */
export function formatTime(ts?: string | null, opts?: Intl.DateTimeFormatOptions): string {
  const d = toDate(ts);
  return d ? (opts ? d.toLocaleTimeString([], opts) : d.toLocaleTimeString()) : FALLBACK;
}

/** Full date+time formatting. Returns '—' for missing/invalid timestamps. */
export function formatDateTime(ts?: string | null, opts?: Intl.DateTimeFormatOptions): string {
  const d = toDate(ts);
  return d ? (opts ? d.toLocaleString([], opts) : d.toLocaleString()) : FALLBACK;
}
