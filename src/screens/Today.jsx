import { useState } from "react";
import { PROGRAM, EXERCISE_MAP, defaultTargetFor } from "../data/exercises";
import { todayISO, formatDisplayDate, dayInfoForDate } from "../utils/date";
import ExerciseLogCard from "../components/ExerciseLogCard";
import FridayPicker from "../components/FridayPicker";
import { IconPlus } from "../components/icons";

export default function Today({ sessions, onLogSet, onNotesChange, fridayPicks, onSaveFridayPicks, onGoToBodyWeight }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  const date = todayISO();
  const dayInfo = dayInfoForDate(new Date());
  const picksForToday = fridayPicks[date] || [];

  const items =
    dayInfo.type === "workout"
      ? PROGRAM[dayInfo.key].map((entry) => ({
          exercise: EXERCISE_MAP[entry.exerciseId],
          target: entry,
        }))
      : dayInfo.type === "custom"
      ? picksForToday.map((id) => ({ exercise: EXERCISE_MAP[id], target: defaultTargetFor(id) }))
      : [];

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="eyebrow">{dayInfo.label}</div>
        <h1 className="title-xl">{dayInfo.type === "rest" ? "Rest Day" : dayInfo.focus}</h1>
        <p className="subtitle">{formatDisplayDate(date)}</p>
      </div>

      {dayInfo.type === "rest" && (
        <div className="rest-hero">
          <div className="icon">🌙</div>
          <h2>Recovery day</h2>
          <p>
            No lifting scheduled for {dayInfo.label}. Rest, hydrate, and let the muscle grow.
            <br />
            You can still log your body weight below.
          </p>
          <button className="btn btn-secondary" style={{ marginTop: 20 }} onClick={onGoToBodyWeight}>
            Log Body Weight
          </button>
        </div>
      )}

      {dayInfo.type === "custom" && (
        <>
          <button className="btn btn-secondary btn-block" onClick={() => setPickerOpen(true)} style={{ marginBottom: 16 }}>
            <IconPlus width={16} height={16} />
            {picksForToday.length ? "Edit Today's Exercises" : "Pick Today's Exercises"}
          </button>
          {items.length === 0 && (
            <div className="empty-state">
              <div className="icon">🎯</div>
              <p>Choose 5-6 exercises for your weak points today.</p>
            </div>
          )}
        </>
      )}

      {items.map(({ exercise, target }) => (
        <ExerciseLogCard
          key={`${exercise.id}-${date}`}
          exercise={exercise}
          target={target}
          date={date}
          day={dayInfo.key}
          sessions={sessions}
          onLogSet={(setNumber, weight, reps) => onLogSet(exercise, dayInfo.key, setNumber, weight, reps)}
          onNotesChange={(notes) => onNotesChange(exercise, dayInfo.key, notes)}
        />
      ))}

      {pickerOpen && (
        <FridayPicker
          initialPicks={picksForToday}
          onClose={() => setPickerOpen(false)}
          onSave={(picks) => onSaveFridayPicks(date, picks)}
        />
      )}
    </div>
  );
}
