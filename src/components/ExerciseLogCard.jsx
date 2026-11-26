import { useState } from "react";
import { IconCheck, IconPlus, IconClose, IconChevronRight, IconTimer } from "./icons";
import { findSession, getBestSet, getBestRepsOnlySet } from "../utils/sessionOps";
import { WARMUP_SETS } from "../data/exercises";
import { DEMOS } from "../data/demos";
import ExerciseDemo from "./ExerciseDemo";
import RepCoach from "./RepCoach";
import { haptic } from "../utils/motion";

function buildInitialRows({ exercise, target, date, sessions }) {
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
    // No earlier log to copy from: pre-fill reps with the plan's target
    // (e.g. "15") so only the weight needs keying in.
    const defaultReps = /^\d+$/.test(target.repRange) ? target.repRange : "";
    return {
      setNumber,
      weight: prior?.weight != null ? String(prior.weight) : "",
      reps: prior?.reps != null ? String(prior.reps) : defaultReps,
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

function formatClock(totalSeconds) {
  const m = Math.floor(totalSeconds / 60);
  const s = totalSeconds % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatSet(set) {
  return set.weight != null ? `${set.weight}kg${set.reps != null ? ` × ${set.reps}` : ""}` : `${set.reps} reps`;
}

// One exercise in today's list. Collapsed it's a single compact row (number,
// name, muscle, set dots); expanded it shows the set inputs. Only one card is
// open at a time — Today controls `expanded`. Rest is handled by the
// full-screen FocusTimer (the ⏱ button opens it manually).
export default function ExerciseLogCard({
  index,
  exercise,
  target,
  date,
  sessions,
  done,
  expanded,
  onToggle,
  restSeconds,
  onStartTimer,
  demoOpen = true,
  onToggleDemo,
  onLogSet,
  onDeleteSet,
  onNotesChange,
}) {
  const [rows, setRows] = useState(() => buildInitialRows({ exercise, target, date, sessions }));
  const existing = findSession(sessions, date, exercise.id);
  const [noteOpen, setNoteOpen] = useState(Boolean(existing?.notes));
  const [note, setNote] = useState(existing?.notes || "");
  const [prRowIndex, setPrRowIndex] = useState(null);

  const loggedSets = existing?.sets || [];
  const best = getBestSet(sessions, exercise.id, date);
  const bestRepsOnly = getBestRepsOnlySet(sessions, exercise.id, date);
  const dotCount = Math.max(target.sets, loggedSets.length);

  function updateRow(i, patch) {
    setRows((prev) => prev.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }

  // Weight and reps are each optional — log with just one filled in
  // (bodyweight exercises need only reps; some sets only need weight noted).
  function handleSave(i, override = {}) {
    const row = { ...rows[i], ...override };
    const weight = row.weight === "" ? null : parseFloat(row.weight);
    const reps = row.reps === "" ? null : parseInt(row.reps, 10);
    if (weight == null && reps == null) return;
    if (weight != null && (Number.isNaN(weight) || weight < 0)) return;
    if (reps != null && (Number.isNaN(reps) || reps < 0)) return;

    const isPR = onLogSet(row.setNumber, weight, reps);
    haptic(isPR ? [12, 60, 24] : 12);
    // Carry this weight into the next untouched set so the same number
    // doesn't have to be typed twice.
    setRows((prev) =>
      prev.map((r, idx) => {
        if (idx === i) return { ...r, ...override, saved: { weight, reps } };
        if (idx === i + 1 && !r.saved && r.weight === "" && weight != null) return { ...r, weight: String(weight) };
        return r;
      })
    );
    if (isPR) {
      setPrRowIndex(i);
      setTimeout(() => setPrRowIndex((cur) => (cur === i ? null : cur)), 550);
    }
  }

  // Only saved rows have anything to delete; renumber what's left.
  function handleDelete(i) {
    onDeleteSet(rows[i].setNumber);
    setRows((prev) => prev.filter((_, idx) => idx !== i).map((r, idx) => ({ ...r, setNumber: idx + 1 })));
  }

  // Rep Coach works on the first set that isn't logged yet.
  const [coachOpen, setCoachOpen] = useState(false);
  const coachIndex = rows.findIndex((r) => !r.saved);
  const coachRow = coachIndex >= 0 ? rows[coachIndex] : null;

  function handleCoachFinish(count) {
    setCoachOpen(false);
    if (!coachRow) return;
    if (coachRow.weight !== "") handleSave(coachIndex, { reps: String(count) });
    else updateRow(coachIndex, { reps: String(count) });
  }

  function handleAddSet() {
    const last = rows[rows.length - 1];
    setRows((prev) => [
      ...prev,
      { setNumber: prev.length + 1, weight: last?.weight || "", reps: last?.reps || "", saved: null },
    ]);
  }

  const subtitle =
    !expanded && done && loggedSets.length
      ? loggedSets.map(formatSet).join(" · ")
      : [exercise.target, exercise.kind, `${target.sets} × ${target.repRange}`].filter(Boolean).join(" · ");

  return (
    <div className={`card ex-card${done ? " is-done" : ""}${expanded ? " is-open" : ""}`}>
      <button className="ex-head" onClick={onToggle} aria-expanded={expanded}>
        <span className={`ex-index${done ? " done" : ""}`}>
          {done ? <IconCheck width={14} height={14} /> : index}
        </span>
        <span className="ex-title">
          <span className="ex-name">{exercise.name}</span>
          <span className="ex-sub">{subtitle}</span>
        </span>
        <span className="ex-side">
          {!expanded && (
            <span className="ex-dots" aria-label={`${loggedSets.length} of ${target.sets} sets`}>
              {Array.from({ length: dotCount }, (_, i) => (
                <span key={i} className={`ex-dot${i < loggedSets.length ? " on" : ""}`} />
              ))}
            </span>
          )}
          <span className={`ex-chevron${expanded ? " open" : ""}`}>
            <IconChevronRight />
          </span>
        </span>
      </button>

      {expanded && (
        <div className="ex-body">
          {demoOpen && DEMOS[exercise.id] && (
            <div className="ex-demo">
              <div className="ex-demo-stage">
                <ExerciseDemo exerciseId={exercise.id} />
              </div>
              <div className="ex-demo-text">
                <div className="ex-demo-title">
                  Cara buat
                  {onToggleDemo && (
                    <button className="ex-demo-hide" onClick={onToggleDemo} aria-label="Sembunyi demo">
                      <IconClose width={12} height={12} />
                    </button>
                  )}
                </div>
                <ol className="ex-demo-cues">
                  {DEMOS[exercise.id].cues.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ol>
              </div>
            </div>
          )}

          {(best || bestRepsOnly) && (
            <div className="ex-best">
              Best {best ? formatSet(best) : `${bestRepsOnly.reps} reps`}
            </div>
          )}

          <div className="set-rows">
            {rows.map((row, i) => {
              const isSaved = matchesSaved(row);
              return (
                <div className="set-row" key={row.setNumber}>
                  {row.setNumber <= WARMUP_SETS ? (
                    <div className="set-index warmup" title="Warm-up set">
                      W
                    </div>
                  ) : (
                    <div className="set-index">{row.setNumber}</div>
                  )}
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
                  {row.saved ? (
                    <button
                      className="set-delete-btn"
                      onClick={() => handleDelete(i)}
                      aria-label={`Delete set ${row.setNumber}`}
                    >
                      <IconClose width={14} height={14} />
                    </button>
                  ) : (
                    <span aria-hidden="true" />
                  )}
                </div>
              );
            })}
          </div>


          {coachRow && (
            <button className="coach-launch" onClick={() => setCoachOpen(true)}>
              <span className="coach-launch-icon" aria-hidden="true">
                ▶
              </span>
              <span className="coach-launch-text">
                <span className="coach-launch-title">Mula set {coachRow.setNumber}</span>
                <span className="coach-launch-sub">Kira rep dengan suara</span>
              </span>
              <span className="coach-launch-reps">{target.repRange} reps</span>
            </button>
          )}

          <div className="ex-actions">
            <button className="exercise-action" onClick={handleAddSet}>
              <IconPlus width={14} height={14} /> Set
            </button>
            {!noteOpen && (
              <button className="exercise-action" onClick={() => setNoteOpen(true)}>
                <IconPlus width={14} height={14} /> Note
              </button>
            )}
            {DEMOS[exercise.id] && onToggleDemo && !demoOpen && (
              <button className="exercise-action" onClick={onToggleDemo}>
                Cara buat
              </button>
            )}
            <button className="exercise-action ex-rest-btn" onClick={onStartTimer} aria-label="Mula rest timer">
              <IconTimer width={14} height={14} /> {formatClock(restSeconds)}
            </button>
          </div>

          {coachOpen && coachRow && (
            <RepCoach
              exerciseName={exercise.name}
              setNumber={coachRow.setNumber}
              totalSets={rows.length}
              targetReps={parseInt(coachRow.reps, 10) || parseInt(target.repRange, 10) || 15}
              weight={coachRow.weight}
              onFinish={handleCoachFinish}
              onClose={() => setCoachOpen(false)}
            />
          )}

          {noteOpen && (
            <textarea
              className="note-input"
              placeholder="Notes (form cues, how it felt...)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              onBlur={() => onNotesChange(note)}
              autoFocus={!note}
            />
          )}
        </div>
      )}
    </div>
  );
}
