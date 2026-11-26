import { PROGRAM, EXERCISE_MAP, GUIDELINE } from "../data/exercises";
import { todayISO, formatDisplayDate, dayInfoForDate } from "../utils/date";
import { findSession } from "../utils/sessionOps";
import ExerciseLogCard from "../components/ExerciseLogCard";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { STORAGE_KEYS } from "../utils/storage";

export default function Today({ sessions, onLogSet, onDeleteSet, onNotesChange, onGoToNutrition }) {
  const date = todayISO();
  const dayInfo = dayInfoForDate(new Date());
  const [guideOpen, setGuideOpen] = useLocalStorageState(STORAGE_KEYS.GUIDE_OPEN, true);

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

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="eyebrow">{dayInfo.label}</div>
        <h1 className="title-xl">{dayInfo.type === "rest" ? "Rest Day" : dayInfo.focus}</h1>
        <p className="subtitle">
          {formatDisplayDate(date)}
          {items.length > 0 && ` · ${doneCount}/${items.length} exercises done`}
        </p>
      </div>

      {dayInfo.type === "rest" && (
        <div className="rest-hero">
          <div className="icon">🌙</div>
          <h2>Recovery day</h2>
          <p>
            No lifting scheduled for {dayInfo.label}. Rest, hydrate, and let the muscle grow.
            <br />
            You can still log what you're eating below.
          </p>
          <button className="btn btn-secondary" style={{ marginTop: 20 }} onClick={onGoToNutrition}>
            Log Today's Meals
          </button>
        </div>
      )}

      {dayInfo.type === "workout" && (
        <div className="card plan-card">
          <div className="plan-meta">
            <div>
              <div className="plan-label">Key Focus</div>
              <ul className="plan-focus">
                {dayInfo.keyFocus.map((f) => (
                  <li key={f}>{f}</li>
                ))}
              </ul>
            </div>
            <div className="plan-rest">
              <div className="plan-label">Rest</div>
              <div className="plan-rest-value">{dayInfo.rest}</div>
            </div>
          </div>

          <button className="plan-guide-toggle" onClick={() => setGuideOpen((v) => !v)}>
            {guideOpen ? "Hide" : "Show"} gym guideline
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
      )}

      {items.map(({ exercise, target }, i) => (
        <ExerciseLogCard
          key={`${exercise.id}-${date}`}
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
      ))}
    </div>
  );
}
