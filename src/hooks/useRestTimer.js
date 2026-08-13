import { useCallback, useEffect, useRef, useState } from "react";
import { useLocalStorageState } from "./useLocalStorageState";
import { STORAGE_KEYS } from "../utils/storage";

const DURATION_PRESETS = [60, 90, 120, 180];

// Countdown is driven off an absolute end timestamp (not a decrementing
// counter) so it stays accurate even if the tab is backgrounded/throttled.
export function useRestTimer() {
  const [defaultDuration, setDefaultDuration] = useLocalStorageState(STORAGE_KEYS.REST_DURATION, 90);
  const [endAt, setEndAt] = useState(null);
  const [remaining, setRemaining] = useState(0);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (endAt == null) {
      clearInterval(intervalRef.current);
      return;
    }
    const tick = () => {
      const secs = Math.max(0, Math.round((endAt - Date.now()) / 1000));
      setRemaining(secs);
      if (secs <= 0) {
        clearInterval(intervalRef.current);
        setEndAt(null);
      }
    };
    tick();
    intervalRef.current = setInterval(tick, 250);
    return () => clearInterval(intervalRef.current);
  }, [endAt]);

  const start = useCallback((seconds) => {
    setEndAt(Date.now() + seconds * 1000);
  }, []);

  const addSeconds = useCallback((delta) => {
    setEndAt((prev) => {
      const base = prev && prev > Date.now() ? prev : Date.now();
      const next = base + delta * 1000;
      return next > Date.now() ? next : null;
    });
  }, []);

  const skip = useCallback(() => setEndAt(null), []);

  return {
    active: endAt != null,
    remaining,
    start,
    addSeconds,
    skip,
    defaultDuration,
    setDefaultDuration,
    presets: DURATION_PRESETS,
  };
}
