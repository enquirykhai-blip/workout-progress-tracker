import { useCallback, useEffect, useRef, useState } from "react";

const FINISH_FLASH_MS = 3000;

// One rest countdown per exercise, keyed by exercise id. Lives in App so the
// timers keep running while the user switches tabs or collapses a card.
// Countdowns are driven off absolute end timestamps (not decrementing
// counters) so they stay accurate even when the tab is throttled.
export function useExerciseTimers() {
  const [timers, setTimers] = useState({}); // id -> { endAt, total }
  const [finished, setFinished] = useState({}); // id -> true (briefly, after hitting 0)
  const [now, setNow] = useState(() => Date.now());
  const timersRef = useRef(timers);
  timersRef.current = timers;

  const flashFinished = useCallback((ids) => {
    setFinished((prev) => ({ ...prev, ...Object.fromEntries(ids.map((id) => [id, true])) }));
    setTimeout(() => {
      setFinished((prev) => {
        const next = { ...prev };
        ids.forEach((id) => delete next[id]);
        return next;
      });
    }, FINISH_FLASH_MS);
    try {
      navigator.vibrate?.([180, 90, 180]);
    } catch {
      // vibration unsupported — the visual flash is enough
    }
  }, []);

  const anyRunning = Object.keys(timers).length > 0;
  useEffect(() => {
    if (!anyRunning) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      const done = Object.entries(timersRef.current)
        .filter(([, v]) => v.endAt <= t)
        .map(([id]) => id);
      if (done.length) {
        setTimers((prev) => {
          const next = { ...prev };
          done.forEach((id) => delete next[id]);
          return next;
        });
        flashFinished(done);
      }
    };
    tick();
    const iv = setInterval(tick, 250);
    return () => clearInterval(iv);
  }, [anyRunning, flashFinished]);

  const start = useCallback((id, seconds) => {
    const t = Date.now();
    setNow(t);
    setFinished((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
    setTimers((prev) => ({ ...prev, [id]: { endAt: t + seconds * 1000, total: seconds } }));
  }, []);

  const adjust = useCallback((id, delta) => {
    setTimers((prev) => {
      const cur = prev[id];
      if (!cur) return prev;
      const endAt = cur.endAt + delta * 1000;
      const next = { ...prev };
      if (endAt <= Date.now() + 1000) delete next[id];
      else next[id] = { endAt, total: Math.max(1, cur.total + delta) };
      return next;
    });
  }, []);

  const stop = useCallback((id) => {
    setTimers((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });
  }, []);

  const get = useCallback(
    (id) => {
      const cur = timers[id];
      if (!cur) return { running: false, remaining: 0, total: 0, finished: Boolean(finished[id]) };
      return {
        running: true,
        remaining: Math.max(0, Math.ceil((cur.endAt - now) / 1000)),
        total: cur.total,
        finished: false,
      };
    },
    [timers, finished, now]
  );

  return { start, adjust, stop, get };
}
