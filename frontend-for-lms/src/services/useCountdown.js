import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * useCountdown
 * - totalSeconds: initial total seconds
 * - id: a stable identifier to persist remaining time in localStorage (e.g., `test-${testId}`)
 * - onComplete: callback when reaches 0
 *
 * Persists remaining seconds across reloads; resumes on mount.
 */
export default function useCountdown(totalSeconds, id, onComplete) {
  const storageKey = id ? `countdown:${id}` : null;
  const [remaining, setRemaining] = useState(() => {
    if (!storageKey) return Math.max(0, Math.floor(totalSeconds || 0));
    const raw = localStorage.getItem(storageKey);
    const persisted = raw ? Number(raw) : NaN;
    if (!Number.isFinite(persisted)) return Math.max(0, Math.floor(totalSeconds || 0));
    return Math.max(0, Math.floor(persisted));
  });

  const timerRef = useRef(null);

  const clearTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  useEffect(() => {
    // Start ticking
    clearTimer();
    if (remaining <= 0) return;
    timerRef.current = setInterval(() => {
      setRemaining((r) => {
        const next = r - 1;
        if (storageKey) localStorage.setItem(storageKey, String(Math.max(0, next)));
        if (next <= 0) {
          clearTimer();
          if (storageKey) localStorage.setItem(storageKey, '0');
          if (typeof onComplete === 'function') onComplete();
          return 0;
        }
        return next;
      });
    }, 1000);
    return clearTimer;
  }, [remaining > 0, storageKey, onComplete, clearTimer]);

  // Reset helper
  const reset = useCallback((secs) => {
    const v = Math.max(0, Math.floor(secs ?? totalSeconds ?? 0));
    setRemaining(v);
    if (storageKey) localStorage.setItem(storageKey, String(v));
  }, [storageKey, totalSeconds]);

  const format = useCallback(() => {
    const hrs = Math.floor(remaining / 3600);
    const mins = Math.floor((remaining % 3600) / 60);
    const secs = remaining % 60;
    const mm = hrs > 0 ? String(mins).padStart(2, '0') : String(mins);
    const prefix = hrs > 0 ? `${hrs}:` : '';
    return `${prefix}${mm}:${String(secs).padStart(2, '0')}`;
  }, [remaining]);

  return { remaining, setRemaining, reset, format };
}
