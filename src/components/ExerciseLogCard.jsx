import { useState } from "react";
import { IconCheck, IconPlus } from "./icons";
import { findSession, getBestSet, getBestRepsOnlySet } from "../utils/sessionOps";

function buildInitialRows({ exercise, target, date, day, sessions }) {
  const existing = findSession(sessions, date, exercise.id);
  const rowCount = Math.max(target.sets, existing?.sets.length || 0);

  // Find the most recent prior session for this exercise to prefill suggested numbers.
  const priorSessions = sessions
    .filter((s) => s.exerciseId === exercise.id && s.date < date && s.sets.length > 0)
    .sort((a, b) => (a.date < b.date ? 1 : -1));
  const priorSets = priorSessions[0]?.sets || [];

  return Array.from({ length: rowCount }, (_, i) => {
    const setNumber = i + 1;
    const loggedSet = existing?.sets.find((s) => s.setNumber === setNumber);
    if (loggedSet) {
      return {
        setNumber,
        weight: loggedSet.weight != null ? String(loggedSet.weight) : "",
        reps: loggedSet.reps != null ? String(loggedSet.reps) : "",
        saved: { weight: loggedSet.weight ?? null, reps: loggedSet.reps ?? null },
      };
    }
    const prior = priorSets.find((s) => s.setNumber === setNumber) || priorSets[priorSets.length - 1];
    return {
      setNumber,
      weight: prior?.weight != null ? String(prior.weight) : "",
      reps: prior?.reps != null ? String(prior.reps) : "",
      saved: null,
    };
  });
}

// True when the row's current text inputs match what was last saved for it —
// blank input <-> a null (not logged) value on either side.
function matchesSaved(row) {
  if (!row.saved) return false;
  const savedWeightStr = row.saved.weight == null ? "" : String(row.saved.weight);
  const savedRepsStr = row.saved.reps == null ? "" : String(row.saved.reps);
  return savedWeightStr === row.weight && savedRepsStr === row.reps;
}

export default function ExerciseLogCard({ exercise, target, date, day, sessions, onLogSet, onNotesChange }) {
  const [rows, setRows] = useState(() => buildInitialRows({ exercise, target, date, day, sessions }));
  const existing = findSession(sessions, date, exercise.id);
  const [noteOpen, setNoteOpen] = useState(Boolean(existing?.notes));
  const [note, setNote] = useState(existing?.notes || "");
  const [prRowIndex, setPrRowIndex] = useState(null);

  const best = getBestSet(sessions, exercise.id, date);
  const bestRepsOnly = getBestRepsOnlySet(sessions, exercise.id, date);

  function updateRow(index, patch) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, ...patch } : r)));
  }

  // Weight and reps are each optional — log with just one filled in
  // (bodyweight exercises need only reps; some sets only need weight noted).
  function handleSave(index) {
    const row = rows[index];
    const weight = row.weight === "" ? null : parseFloat(row.weight);
    const reps = row.reps === "" ? null : parseInt(row.reps, 10);
    if (weight == null && reps == null) return;
    if (weight != null && (Number.isNaN(weight) || weight < 0)) return;
    if (reps != null && (Number.isNaN(reps) || reps < 0)) return;

    const isPR = onLogSet(row.setNumber, weight, reps);
    updateRow(index, { saved: { weight, reps } });
    if (isPR) {
      setPrRowIndex(index);
      setTimeout(() => setPrRowIndex((cur) => (cur === index ? null : cur)), 550);
    }
  }

  function handleAddSet() {
    const last = rows[rows.length - 1];
    setRows((prev) => [
      ...prev,
      { setNumber: prev.length + 1, weight: last?.weight || "", reps: last?.reps || "", saved: null },
    ]);
  }

  function handleNoteBlur() {
    onNotesChange(note);
  }

  return (
    <div className="card exercise-card">
      <div className="exercise-card-head">
        <div>
          <div className="exercise-name">{exercise.name}</div>
          <div className="exercise-target">
            {target.sets} × {target.repRange}
          </div>
        </div>
        {best ? (
          <div className="exercise-best">
            Best {best.weight}kg{best.reps > 0 ? ` × ${best.reps}` : ""}
          </div>
        ) : (
          bestRepsOnly && <div className="exercise-best">Best {bestRepsOnly.reps} reps</div>
        )}
      </div>

      <p className="exercise-hint">Weight and reps are both optional — log either one, or both.</p>

      <div className="set-rows">
        {rows.map((row, i) => {
          const isSaved = matchesSaved(row);
          return (
            <div className="set-row" key={row.setNumber}>
              <div className="set-index">{row.setNumber}</div>
              <div className="set-field">
                <input
                  type="text"
                  inputMode="decimal"
                  placeholder="—"
                  value={row.weight}
                  onChange={(e) => updateRow(i, { weight: e.target.value.replace(/[^0-9.]/g, "") })}
                />
                <span className="unit">KG</span>
              </div>
              <div className="set-field">
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder="—"
                  value={row.reps}
                  onChange={(e) => updateRow(i, { reps: e.target.value.replace(/[^0-9]/g, "") })}
                />
                <span className="unit">REPS</span>
              </div>
              <button
                className={`set-log-btn${isSaved ? " done" : ""}${prRowIndex === i ? " pr" : ""}`}
                onClick={() => handleSave(i)}
                disabled={row.weight === "" && row.reps === ""}
                aria-label={`Log set ${row.setNumber}`}
              >
                <IconCheck />
              </button>
            </div>
          );
        })}
      </div>

      <button className="add-set-row" onClick={handleAddSet}>
        <IconPlus width={14} height={14} /> Add Set
      </button>

      {noteOpen ? (
        <textarea
          className="note-input"
          placeholder="Notes (form cues, how it felt...)"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          onBlur={handleNoteBlur}
          autoFocus
        />
      ) : (
        <button className="note-toggle" onClick={() => setNoteOpen(true)}>
          + Add note
        </button>
      )}
    </div>
  );
}
