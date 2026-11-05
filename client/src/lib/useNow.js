import { useEffect, useState } from 'react';

/** Current time, re-rendering every `ms` milliseconds (for live countdowns). */
export function useNow(ms = 1000, enabled = true) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!enabled) return undefined;
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms, enabled]);
  return now;
}

/** Re-run `fn` every `ms` milliseconds while `enabled`. */
export function usePolling(fn, ms, enabled) {
  useEffect(() => {
    if (!enabled) return undefined;
    const id = setInterval(fn, ms);
    return () => clearInterval(id);
  }, [fn, ms, enabled]);
}

/** Seconds from `now` until `date` (never negative). */
export const secondsUntil = (date, now = Date.now()) => Math.max(0, Math.ceil((new Date(date).getTime() - now) / 1000));
