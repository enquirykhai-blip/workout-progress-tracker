import { useEffect, useRef } from "react";
import { IconClose } from "./icons";

function formatTime(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function RestTimerBar({ active, remaining, addSeconds, skip }) {
  // Tracks the highest `remaining` seen since the timer last (re)started, so
  // the progress bar has a stable 100% reference even as +15s bumps extend it.
  const maxRef = useRef(remaining);
  useEffect(() => {
    if (!active) {
      maxRef.current = 0;
      return;
    }
    if (remaining > maxRef.current) maxRef.current = remaining;
  }, [active, remaining]);

  if (!active) return null;

  const progress = maxRef.current > 0 ? remaining / maxRef.current : 0;

  return (
    <div className="rest-timer-bar">
      <div className="rest-timer-progress" style={{ transform: `scaleX(${progress})` }} />
      <div className="rest-timer-row">
        <button className="rest-timer-adjust" onClick={() => addSeconds(-15)} aria-label="Subtract 15 seconds">
          −15
        </button>
        <div className="rest-timer-time">{formatTime(remaining)}</div>
        <button className="rest-timer-adjust" onClick={() => addSeconds(15)} aria-label="Add 15 seconds">
          +15
        </button>
        <button className="rest-timer-skip" onClick={skip} aria-label="Skip rest">
          <IconClose width={16} height={16} />
        </button>
      </div>
    </div>
  );
}
