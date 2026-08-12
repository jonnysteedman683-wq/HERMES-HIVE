/**
 * Shared client-side formatting helpers.
 * Consolidates the inline `new Date(x).toLocaleTimeString()` / `toLocaleDateString()`
 * calls that were duplicated across many dashboard components.
 */

/** Format an ISO timestamp as a local time string. Returns '—' when empty/invalid. */
export function formatTime(
  iso: string | null | undefined,
  opts?: Intl.DateTimeFormatOptions
): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleTimeString([], opts);
}

/** Format an ISO timestamp as a local date string. Returns '—' when empty/invalid. */
export function formatDate(
  iso: string | null | undefined,
  opts?: Intl.DateTimeFormatOptions
): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString([], opts);
}
