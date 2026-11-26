import { IconChevronLeft, IconTimer } from "./icons";

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

const SIZE = 264;
const STROKE = 10;

// Full-screen rest timer: one big countdown, nothing else competing for
// attention. Can be minimised to a floating pill and reopened.
export default function FocusTimer({ timer, remaining, minimized, onMinimize, onExpand, onAdjust, onSkip }) {
  if (!timer) return null;

  if (minimized && !timer.finished) {
    return (
      <button className="focus-pill" onClick={onExpand} aria-label="Open rest timer">
        <IconTimer width={16} height={16} />
        <span className="focus-pill-time">{formatClock(remaining)}</span>
        <span className="focus-pill-label">Rest</span>
      </button>
    );
  }

  const r = (SIZE - STROKE) / 2;
  const c = 2 * Math.PI * r;
  const pct = timer.finished ? 1 : timer.total ? remaining / timer.total : 0;

  return (
    <div className={`focus-timer${timer.finished ? " is-go" : ""}`} role="dialog" aria-label="Rest timer">
      <div className="focus-top">
        <button className="focus-icon-btn" onClick={onMinimize} aria-label="Minimise timer" disabled={timer.finished}>
          <IconChevronLeft style={{ transform: "rotate(-90deg)" }} />
        </button>
        <div className="focus-eyebrow">{timer.finished ? "Rest over" : "Rest"}</div>
        <span className="focus-icon-btn ghost" />
      </div>

      {timer.title && <div className="focus-title">{timer.title}</div>}

      <div className="focus-ring" style={{ width: SIZE, height: SIZE }}>
        <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
          <circle cx={SIZE / 2} cy={SIZE / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={STROKE} />
          <circle
            cx={SIZE / 2}
            cy={SIZE / 2}
            r={r}
            fill="none"
            stroke="#fff"
            strokeWidth={STROKE}
            strokeLinecap="round"
            strokeDasharray={c}
            strokeDashoffset={c * (1 - pct)}
            transform={`rotate(-90 ${SIZE / 2} ${SIZE / 2})`}
            style={{ transition: "stroke-dashoffset 0.25s linear" }}
          />
        </svg>
        <div className="focus-ring-center">
          {timer.finished ? (
            <div className="focus-go">GO!</div>
          ) : (
            <>
              <div className="focus-time">{formatClock(remaining)}</div>
              <div className="focus-total">of {formatClock(timer.total)}</div>
            </>
          )}
        </div>
      </div>

      {timer.next && (
        <div className="focus-next">
          <div className="focus-next-label">Next up</div>
          <div className="focus-next-value">{timer.next}</div>
        </div>
      )}

      {!timer.finished && (
        <div className="focus-controls">
          <button className="focus-adjust" onClick={() => onAdjust(-15)} aria-label="Minus 15 seconds">
            −15s
          </button>
          <button className="focus-skip" onClick={onSkip}>
            Skip rest
          </button>
          <button className="focus-adjust" onClick={() => onAdjust(15)} aria-label="Plus 15 seconds">
            +15s
          </button>
        </div>
      )}
    </div>
  );
}
