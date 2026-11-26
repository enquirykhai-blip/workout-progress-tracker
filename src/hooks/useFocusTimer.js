import { useCallback, useEffect, useRef, useState } from "react";

const GO_FLASH_MS = 2200;

// The single, full-screen rest timer. Driven off an absolute end timestamp
// (not a decrementing counter) so it stays accurate when the tab is
// throttled. Lives in App so it survives tab switches.
//
// state: null, or { endAt, total, title, next, finished }
export function useFocusTimer() {
  const [timer, setTimer] = useState(null);
  const [minimized, setMinimized] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const timerRef = useRef(timer);
  timerRef.current = timer;
  const closeRef = useRef(null);

  const running = Boolean(timer && !timer.finished);
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      const t = Date.now();
      setNow(t);
      const cur = timerRef.current;
      if (cur && !cur.finished && cur.endAt <= t) {
        setTimer({ ...cur, finished: true });
        setMinimized(false);
        try {
          navigator.vibrate?.([220, 100, 220, 100, 220]);
        } catch {
          // vibration unsupported — the visual "GO" is enough
        }
        clearTimeout(closeRef.current);
        closeRef.current = setTimeout(() => setTimer(null), GO_FLASH_MS);
      }
    };
    tick();
    const iv = setInterval(tick, 200);
    return () => clearInterval(iv);
  }, [running]);

  useEffect(() => () => clearTimeout(closeRef.current), []);

  const start = useCallback((seconds, meta = {}) => {
    clearTimeout(closeRef.current);
    const t = Date.now();
    setNow(t);
    setMinimized(false);
    setTimer({ endAt: t + seconds * 1000, total: seconds, title: meta.title || "", next: meta.next || "", finished: false });
  }, []);

  const adjust = useCallback((delta) => {
    setTimer((cur) => {
      if (!cur || cur.finished) return cur;
      const endAt = Math.max(Date.now() + 1000, cur.endAt + delta * 1000);
      return { ...cur, endAt, total: Math.max(1, cur.total + delta) };
    });
  }, []);

  const skip = useCallback(() => {
    clearTimeout(closeRef.current);
    setTimer(null);
  }, []);

  const remaining = timer && !timer.finished ? Math.max(0, Math.ceil((timer.endAt - now) / 1000)) : 0;

  return { timer, remaining, minimized, setMinimized, start, adjust, skip };
}
