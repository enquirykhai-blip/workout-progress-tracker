import { PROGRAM, PROGRAMS, EXERCISE_MAP, GUIDELINE, VOLUME_LABEL, DAYS } from "../data/exercises";
import { todayISO, formatDisplayDate, dayInfoForDate } from "../utils/date";
import { findSession, getBestSet } from "../utils/sessionOps";
import ExerciseLogCard from "../components/ExerciseLogCard";
import ProgramPicker from "../components/ProgramPicker";
import { IconArrowRight, IconChevronRight, IconSwap } from "../components/icons";
import { useEffect, useRef, useState } from "react";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { STORAGE_KEYS } from "../utils/storage";

function ProgressRing({ done, total, size = 96, stroke = 5 }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = total ? done / total : 0;
  return (
    <div className="progress-ring" style={{ width: size, height: size }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="rgba(255,255,255,0.14)" strokeWidth={stroke} />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="#fff"
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
      </div>
    </div>
  );
}

export default function Today({
  sessions,
  onLogSet,
  onDeleteSet,
  onNotesChange,
  onGoToNutrition,
  displayName,
  dayOverrides = {},
  onPickProgram,
}) {
  const date = todayISO();
  const dayInfo = dayInfoForDate(new Date(), dayOverrides);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [guideOpen, setGuideOpen] = useLocalStorageState(STORAGE_KEYS.GUIDE_OPEN, false);

  const items =
    dayInfo.type === "workout"
      ? PROGRAM[dayInfo.programId].map((entry) => ({
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

  const ctaLabel = doneCount > 0 ? "Continue" : "Start now";

  // Peak-End Rule: finish the session on a high note — a summary of what
  // was lifted today, with a one-off celebration when the last exercise lands.
  const todaysSessions = items.map(({ exercise }) => findSession(sessions, date, exercise.id)).filter(Boolean);
  const setsLogged = todaysSessions.reduce((n, sess) => n + sess.sets.length, 0);
  const volume = todaysSessions.reduce(
    (kg, sess) => kg + sess.sets.reduce((t, set) => t + (set.weight || 0) * (set.reps || 0), 0),
    0
  );
  const prCount = todaysSessions.filter((sess) => {
    const prev = getBestSet(sessions, sess.exerciseId, date);
    const todayTop = Math.max(0, ...sess.sets.map((set) => set.weight || 0));
    return todayTop > 0 && (!prev || todayTop > prev.weight);
  }).length;

  const wasAllDone = useRef(allDone);
  const [celebrate, setCelebrate] = useState(false);
  useEffect(() => {
    if (allDone && !wasAllDone.current) {
      setCelebrate(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      const t = setTimeout(() => setCelebrate(false), 1600);
      wasAllDone.current = allDone;
      return () => clearTimeout(t);
    }
    wasAllDone.current = allDone;
  }, [allDone]);

  // Next scheduled training day after today (for the rest-day screen).
  const todayIdx = DAYS.findIndex((d) => d.key === dayInfo.key);
  const nextDay = [1, 2, 3, 4, 5, 6, 7].map((n) => DAYS[(todayIdx + n) % 7]).find((d) => d.programId);
  const nextWorkout = nextDay && { label: nextDay.label, ...PROGRAMS[nextDay.programId] };

  const eyebrow = (
    <span className="hero-dark-eyebrow">
      {dayInfo.label} · {formatDisplayDate(date)}
      {dayInfo.overridden && " · Ditukar"}
    </span>
  );

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
          <div className="hero-dark">
            <div className="hero-dark-top">
              <div className="hero-dark-text">
                {eyebrow}
                <span className="hero-dark-title">Rest Day</span>
                <span className="hero-dark-sub">Rehat, minum air, makan cukup protein.</span>
              </div>
              <span className="hero-dark-emoji">🌙</span>
            </div>
            <div className="hero-dark-actions">
              <button className="hero-dark-cta" onClick={onGoToNutrition}>
                Log today's meals <IconArrowRight width={16} height={16} />
              </button>
              <button className="hero-dark-swap" onClick={() => setPickerOpen(true)}>
                <IconSwap width={16} height={16} /> Nak workout?
              </button>
            </div>
          </div>

          {nextWorkout && (
            <>
              <h2 className="section-title">Next Workout</h2>
              <div className="card next-card">
                <div>
                  <div className="next-card-day">{nextWorkout.label}</div>
                  <div className="next-card-focus">{nextWorkout.focus}</div>
                  <div className="next-card-meta">
                    {nextWorkout.exercises.length} exercises · {VOLUME_LABEL} · Rest {nextWorkout.rest}
                  </div>
                </div>
                <ul className="tile-list next-card-list">
                  {nextWorkout.keyFocus.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </>
      ) : (
        <>
          {allDone ? (
            <div className={`hero-dark hero-complete${celebrate ? " celebrate" : ""}`}>
              <div className="hero-dark-top">
                <div className="hero-dark-text">
                  {eyebrow}
                  <span className="hero-dark-title">Workout complete</span>
                  <span className="hero-dark-sub">{dayInfo.focus} Day siap. Good work!</span>
                </div>
                <span className="hero-dark-emoji">🏆</span>
              </div>
              <div className="hero-stats">
                <div>
                  <div className="hero-stat-value">{setsLogged}</div>
                  <div className="hero-stat-label">Sets</div>
                </div>
                <div>
                  <div className="hero-stat-value">{volume.toLocaleString("en-US")}</div>
                  <div className="hero-stat-label">kg lifted</div>
                </div>
                <div>
                  <div className="hero-stat-value">{prCount}</div>
                  <div className="hero-stat-label">{prCount === 1 ? "PR" : "PRs"}</div>
                </div>
              </div>
              <button className="hero-dark-cta" onClick={onGoToNutrition}>
                Log today's meals <IconArrowRight width={16} height={16} />
              </button>
            </div>
          ) : (
            <div className="hero-dark">
              <div className="hero-dark-top">
                <div className="hero-dark-text">
                  {eyebrow}
                  <span className="hero-dark-title">{dayInfo.focus} Day</span>
                  <span className="hero-dark-sub">Up next: {nextItem.exercise.name}</span>
                </div>
                <ProgressRing done={doneCount} total={items.length} />
              </div>
              <div className="hero-dark-actions">
                <button className="hero-dark-cta" onClick={scrollToNext}>
                  {ctaLabel} <IconArrowRight width={16} height={16} />
                </button>
                <button className="hero-dark-swap" onClick={() => setPickerOpen(true)}>
                  <IconSwap width={16} height={16} /> Tukar
                </button>
              </div>
            </div>
          )}

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
                  <div className="tile-stat-value">{VOLUME_LABEL.replace(/ /g, "")}</div>
                  <div className="tile-stat-label">Volume</div>
                </div>
              </div>
              <div className="tile-foot">Till failure</div>
            </div>
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
              {doneCount}/{items.length} done · {VOLUME_LABEL} each
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
                onLogSet={(setNumber, weight, reps) =>
                  onLogSet(exercise, dayInfo.key, setNumber, weight, reps, dayInfo.restSeconds)
                }
                onDeleteSet={(setNumber) => onDeleteSet(exercise, setNumber)}
                onNotesChange={(notes) => onNotesChange(exercise, dayInfo.key, notes)}
              />
            </div>
          ))}
        </>
      )}

      {pickerOpen && (
        <ProgramPicker
          dayInfo={dayInfo}
          onPick={(programId) => onPickProgram?.(date, programId)}
          onClose={() => setPickerOpen(false)}
        />
      )}
    </div>
  );
}
