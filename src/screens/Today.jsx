import { PROGRAM, EXERCISE_MAP, GUIDELINE } from "../data/exercises";
import { todayISO, formatDisplayDate, dayInfoForDate } from "../utils/date";
import { findSession } from "../utils/sessionOps";
import ExerciseLogCard from "../components/ExerciseLogCard";
import { IconArrowRight, IconFlame, IconChevronRight } from "../components/icons";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { STORAGE_KEYS } from "../utils/storage";

function ProgressRing({ done, total, size = 128, stroke = 3 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total ? done / total : 0;
  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--border)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--accent)"
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={c * (1 - pct)}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: "stroke-dashoffset 0.4s ease" }}
        />
      </svg>
      <div className="progress-ring-center">
        <div className="progress-ring-value">
          {done}
          <span>/{total}</span>
        </div>
        <div className="progress-ring-label">done</div>
      </div>
    </div>
  );
}

export default function Today({ sessions, onLogSet, onDeleteSet, onNotesChange, onGoToNutrition, displayName }) {
  const date = todayISO();
  const dayInfo = dayInfoForDate(new Date());
  const [guideOpen, setGuideOpen] = useLocalStorageState(STORAGE_KEYS.GUIDE_OPEN, false);

  const items =
    dayInfo.type === "workout"
      ? PROGRAM[dayInfo.key].map((entry) => ({
          exercise: EXERCISE_MAP[entry.exerciseId],
          target: entry,
        }))
      : [];

  const isExerciseDone = (exercise, target) => {
    const session = findSession(sessions, date, exercise.id);
    return Boolean(session && session.sets.length >= target.sets);
  };
  const doneCount = items.filter(({ exercise, target }) => isExerciseDone(exercise, target)).length;
  const nextItem = items.find(({ exercise, target }) => !isExerciseDone(exercise, target));
  const allDone = items.length > 0 && !nextItem;

  function scrollToNext() {
    const target = nextItem || items[0];
    if (!target) return;
    document.getElementById(`ex-${target.exercise.id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const ctaLabel = allDone ? "All done" : doneCount > 0 ? "Continue" : "Start now";

  return (
    <div className="screen">
      <div className="home-greeting">
        <div className="avatar">{displayName?.[0]?.toUpperCase() || "?"}</div>
        <div>
          <div className="greet-sub">Welcome back</div>
          <div className="greet-name">{displayName}</div>
        </div>
      </div>

      {dayInfo.type === "rest" ? (
        <>
          <button className="hero-dark" onClick={onGoToNutrition}>
            <span className="hero-dark-icon">🌙</span>
            <span className="hero-dark-text">
              <span className="hero-dark-title">Rest Day</span>
              <span className="hero-dark-sub">{dayInfo.label} · log your meals</span>
            </span>
            <span className="hero-dark-arrow">
              <IconChevronRight />
            </span>
          </button>

          <h2 className="section-title">Recovery</h2>
          <div className="card rest-card">
            <p>
              No lifting scheduled for {dayInfo.label}. Rest, hydrate, and let the muscle grow — macro
              tracking doesn't take a day off.
            </p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={onGoToNutrition}>
              Log Today's Meals
            </button>
          </div>
        </>
      ) : (
        <>
          <button className="hero-dark" onClick={scrollToNext}>
            <span className="hero-dark-icon">
              <IconFlame />
            </span>
            <span className="hero-dark-text">
              <span className="hero-dark-title">{dayInfo.focus} Day</span>
              <span className="hero-dark-sub">
                {items.length} exercises · 4 × 15
              </span>
            </span>
            <span className="hero-dark-arrow">
              <IconChevronRight />
            </span>
          </button>

          <h2 className="section-title">Today's Plan</h2>
          <div className="tile-row">
            <div className="card tile">
              <div className="tile-head">Key Focus</div>
              <ul className="tile-list">
                {dayInfo.keyFocus.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
            <div className="card tile">
              <div className="tile-head">Rest</div>
              <div className="tile-stat">
                <div>
                  <div className="tile-stat-value">{dayInfo.rest.replace(" mins", "")}</div>
                  <div className="tile-stat-label">Mins</div>
                </div>
                <div className="tile-stat-divider" />
                <div>
                  <div className="tile-stat-value">4×15</div>
                  <div className="tile-stat-label">Volume</div>
                </div>
              </div>
              <div className="tile-foot">Set 1 = warm-up</div>
            </div>
          </div>

          <div className="card progress-card">
            <div className="progress-card-text">
              <div className="progress-card-eyebrow">
                {dayInfo.label} · {formatDisplayDate(date)}
              </div>
              <div className="progress-card-title">Overall Progress</div>
              <p className="progress-card-desc">
                {allDone
                  ? "Semua exercise siap. Good work!"
                  : `${doneCount} of ${items.length} exercises done. Push all out till failure.`}
              </p>
              <button className="btn btn-primary btn-sm" onClick={scrollToNext} disabled={allDone}>
                {ctaLabel}
              </button>
            </div>
            <ProgressRing done={doneCount} total={items.length} />
          </div>

          <div className="card guide-card">
            <button className="guide-toggle" onClick={() => setGuideOpen((v) => !v)}>
              <span>
                <span className="guide-toggle-title">Start Gym Guideline</span>
                <span className="guide-toggle-sub">Warm up, tempo, volume & rest</span>
              </span>
              <span className={`guide-chevron${guideOpen ? " open" : ""}`}>
                <IconChevronRight />
              </span>
            </button>
            {guideOpen && (
              <ol className="plan-guide">
                {GUIDELINE.map((g, i) => (
                  <li key={g.title}>
                    <span className="plan-guide-num">{String(i + 1).padStart(2, "0")}</span>
                    <div>
                      <div className="plan-guide-title">{g.title}</div>
                      <div className="plan-guide-body">{g.body}</div>
                    </div>
                  </li>
                ))}
              </ol>
            )}
          </div>

          <div className="section-head">
            <h2 className="section-title">Exercises</h2>
            <div className="section-sub">
              {items.length} exercises · {dayInfo.focus}
            </div>
          </div>

          {items.map(({ exercise, target }, i) => (
            <div id={`ex-${exercise.id}`} className="exercise-anchor" key={`${exercise.id}-${date}`}>
              <ExerciseLogCard
                index={i + 1}
                exercise={exercise}
                target={target}
                date={date}
                day={dayInfo.key}
                sessions={sessions}
                done={isExerciseDone(exercise, target)}
                onLogSet={(setNumber, weight, reps) => onLogSet(exercise, dayInfo.key, setNumber, weight, reps)}
                onDeleteSet={(setNumber) => onDeleteSet(exercise, setNumber)}
                onNotesChange={(notes) => onNotesChange(exercise, dayInfo.key, notes)}
              />
            </div>
          ))}

          {allDone && (
            <button className="btn btn-secondary btn-block" onClick={onGoToNutrition} style={{ marginTop: 6 }}>
              Log Today's Meals <IconArrowRight width={16} height={16} />
            </button>
          )}
        </>
      )}
    </div>
  );
}
