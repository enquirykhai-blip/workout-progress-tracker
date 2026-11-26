import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import RepCoach from "./RepCoach";
import ExerciseDemo from "./ExerciseDemo";
import { IconClose } from "./icons";
import { findSession } from "../utils/sessionOps";
import { malayNumber, useSpeech, useTicks, useWakeLock, unlockAudio } from "../hooks/useVoice";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { STORAGE_KEYS } from "../utils/storage";
import { haptic } from "../utils/motion";

// Focus Mode: one full-screen flow through the whole workout.
//   prep (first set only) → set (Rep Coach counts) → auto-save → rest →
//   next set starts on its own → … → next exercise → … → complete.
// Every set is logged as it finishes, so leaving halfway keeps progress.

const RING = 248;
const STROKE = 10;

function formatClock(s) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
}

// The weight to suggest for a set: what was just lifted today, else the
// same set from the last session, else nothing.
function suggestWeight(sessions, date, exerciseId, setNumber) {
  const today = findSession(sessions, date, exerciseId);
  const lastToday = today?.sets.filter((s) => s.weight != null).at(-1);
  if (lastToday) return String(lastToday.weight);
  const prior = sessions
    .filter((s) => s.exerciseId === exerciseId && s.date < date && s.sets.length)
    .sort((a, b) => (a.date < b.date ? 1 : -1))[0];
  const match = prior?.sets.find((s) => s.setNumber === setNumber) || prior?.sets.at(-1);
  return match?.weight != null ? String(match.weight) : "";
}

function WeightStepper({ value, onChange, step = 2.5 }) {
  const n = parseFloat(value);
  const bump = (d) => {
    const base = Number.isNaN(n) ? 0 : n;
    const next = Math.max(0, Math.round((base + d) * 100) / 100);
    onChange(String(next));
  };
  return (
    <div className="fs-weight">
      <button className="fs-weight-btn" onClick={() => bump(-step)} aria-label={`Kurang ${step}kg`}>
        −
      </button>
      <label className="fs-weight-field">
        <input
          type="text"
          inputMode="decimal"
          placeholder="—"
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^0-9.]/g, ""))}
          aria-label="Berat (kg)"
        />
        <span>kg</span>
      </label>
      <button className="fs-weight-btn" onClick={() => bump(step)} aria-label={`Tambah ${step}kg`}>
        +
      </button>
    </div>
  );
}

export default function FocusSession({ items, sessions, date, restSeconds, focusLabel, onLogSet, onClose }) {
  // The queue of every set still to do today, in order. Built once so it
  // doesn't shift under us as sets get logged.
  const [queue] = useState(() =>
    items.flatMap(({ exercise, target }) => {
      const logged = findSession(sessions, date, exercise.id)?.sets.length || 0;
      return Array.from({ length: Math.max(0, target.sets - logged) }, (_, k) => ({
        exercise,
        target,
        setNumber: logged + k + 1,
        totalSets: target.sets,
      }));
    })
  );
  const exerciseOrder = useMemo(() => [...new Set(items.map((i) => i.exercise.id))], [items]);

  const [idx, setIdx] = useState(0);
  const [stage, setStage] = useState(queue.length ? "prep" : "complete"); // prep | set | rest | complete
  const [weights, setWeights] = useState({});
  const [autoNext, setAutoNext] = useLocalStorageState(STORAGE_KEYS.FOCUS_AUTO_NEXT, true);
  const [voiceOn] = useLocalStorageState(STORAGE_KEYS.REP_VOICE, true);
  const [done, setDone] = useState([]); // { name, weight, reps }

  const { say, stop: stopSpeech } = useSpeech(voiceOn);
  const { tick } = useTicks(true);
  useWakeLock(stage !== "complete");

  const cur = queue[idx];
  const next = queue[idx + 1];
  const weightFor = useCallback(
    (i) => {
      const q = queue[i];
      if (!q) return "";
      return weights[i] ?? suggestWeight(sessions, date, q.exercise.id, q.setNumber);
    },
    [queue, weights, sessions, date]
  );
  const setWeightFor = (i, v) => setWeights((w) => ({ ...w, [i]: v }));

  // ---- set finished (from Rep Coach) ----
  const handleSetDone = useCallback(
    (reps) => {
      const q = queue[idx];
      const w = weightFor(idx);
      const weight = w === "" ? null : parseFloat(w);
      onLogSet(q.exercise, q.setNumber, Number.isNaN(weight) ? null : weight, reps);
      setDone((d) => [...d, { name: q.exercise.name, weight, reps }]);
      // Carry the weight forward to the next set of the same exercise.
      const nq = queue[idx + 1];
      if (nq && nq.exercise.id === q.exercise.id && weights[idx + 1] == null && w !== "") {
        setWeights((ws) => ({ ...ws, [idx + 1]: w }));
      }
      if (!nq) {
        stopSpeech();
        say("Workout siap! Syabas.", "Workout complete. Well done!");
        haptic([20, 80, 20, 80, 40]);
        setStage("complete");
        return;
      }
      setStage("rest");
    },
    [queue, idx, weightFor, weights, onLogSet, say, stopSpeech]
  );

  // ---- rest between sets ----
  const [restEnd, setRestEnd] = useState(0);
  const [restTotal, setRestTotal] = useState(restSeconds);
  const [now, setNow] = useState(() => Date.now());
  const warned = useRef(false);

  useEffect(() => {
    if (stage !== "rest") return;
    const end = Date.now() + restSeconds * 1000;
    setRestEnd(end);
    setRestTotal(restSeconds);
    setNow(Date.now());
    warned.current = false;
    const nq = queue[idx + 1];
    const sameExercise = nq.exercise.id === queue[idx].exercise.id;
    const what = sameExercise
      ? { ms: `set ${malayNumber(nq.setNumber)}`, en: `set ${nq.setNumber}` }
      : { ms: nq.exercise.name, en: nq.exercise.name };
    // Queued after Rep Coach's "Siap!" so it isn't cut off.
    say(`Rehat. Seterusnya, ${what.ms}.`, `Rest. Next, ${what.en}.`, { interrupt: false });
  }, [stage, restSeconds, queue, idx, say]);

  const restLeft = stage === "rest" ? Math.max(0, Math.ceil((restEnd - now) / 1000)) : 0;

  const goNext = useCallback(() => {
    setIdx((i) => i + 1);
    setStage(autoNext ? "set" : "prep");
  }, [autoNext]);

  useEffect(() => {
    if (stage !== "rest") return;
    const iv = setInterval(() => {
      const t = Date.now();
      setNow(t);
      const left = Math.ceil((restEnd - t) / 1000);
      if (left === 10 && !warned.current) {
        warned.current = true;
        say("Sepuluh saat lagi.", "Ten seconds.", { interrupt: false });
        tick(660, 0.08, 0.14);
      }
      if (left <= 0) {
        clearInterval(iv);
        haptic([30, 60, 30]);
        tick(880, 0.15, 0.2);
        goNext();
      }
    }, 200);
    return () => clearInterval(iv);
  }, [stage, restEnd, say, tick, goNext]);

  function adjustRest(delta) {
    setRestEnd((e) => Math.max(Date.now() + 1000, e + delta * 1000));
    setRestTotal((t) => Math.max(1, t + delta));
    if (delta > 0) warned.current = false;
  }

  function skipRest() {
    unlockAudio();
    stopSpeech();
    goNext();
  }

  function begin() {
    unlockAudio(); // first tap unlocks audio + speech for the whole session
    setStage("set");
  }

  function skipExercise() {
    const id = cur.exercise.id;
    let j = idx;
    while (queue[j] && queue[j].exercise.id === id) j += 1;
    stopSpeech();
    if (j >= queue.length) setStage("complete");
    else {
      setIdx(j);
      setStage("prep");
    }
  }

  useEffect(() => () => stopSpeech(), [stopSpeech]);

  // ---- header progress ----
  const exNumber = cur ? exerciseOrder.indexOf(cur.exercise.id) + 1 : exerciseOrder.length;
  const progressPct = queue.length ? (stage === "complete" ? 1 : idx / queue.length) : 1;
  const eyebrow = cur
    ? `Exercise ${exNumber}/${exerciseOrder.length} · Set ${cur.setNumber}/${cur.totalSets}`
    : "";

  // Summary covers everything logged today for this workout, not just this
  // sitting — so leaving and resuming still adds up.
  const todaysSets = items.flatMap(({ exercise }) => findSession(sessions, date, exercise.id)?.sets || []);
  const exercisesTrained = items.filter(({ exercise }) => findSession(sessions, date, exercise.id)?.sets.length).length;
  const totalVolume = todaysSets.reduce((v, st) => v + (st.weight || 0) * (st.reps || 0), 0);

  const r = (RING - STROKE) / 2;
  const c = 2 * Math.PI * r;

  return createPortal(
    <div className={`fs fs-${stage}`} role="dialog" aria-label="Mod Fokus">
      <div className="fs-progress" aria-hidden="true">
        <span style={{ transform: `scaleX(${progressPct})` }} />
      </div>

      {stage === "set" && cur && (
        <RepCoach
          key={idx}
          embedded
          autoStart
          autoSaveMs={3000}
          eyebrow={eyebrow}
          exerciseName={cur.exercise.name}
          setNumber={cur.setNumber}
          totalSets={cur.totalSets}
          targetReps={parseInt(cur.target.repRange, 10) || 15}
          weight={weightFor(idx)}
          onFinish={handleSetDone}
          onClose={() => setStage("prep")}
        />
      )}

      {stage === "prep" && cur && (
        <div className="fs-screen">
          <div className="coach-top">
            <button className="focus-icon-btn" onClick={onClose} aria-label="Keluar Mod Fokus">
              <IconClose width={18} height={18} />
            </button>
            <div className="coach-head">
              <div className="coach-eyebrow">{eyebrow}</div>
              <div className="coach-title">Mod Fokus · {focusLabel}</div>
            </div>
            <span className="focus-icon-btn ghost" />
          </div>

          <div className="fs-prep-body">
            <div className="fs-demo">
              <ExerciseDemo exerciseId={cur.exercise.id} />
            </div>
            <div className="fs-name">{cur.exercise.name}</div>
            <div className="fs-meta">
              {[cur.exercise.target, `${cur.totalSets} × ${cur.target.repRange}`].filter(Boolean).join(" · ")}
            </div>
            <WeightStepper value={weightFor(idx)} onChange={(v) => setWeightFor(idx, v)} />
          </div>

          <button
            className={`coach-toggle fs-auto${autoNext ? " on" : ""}`}
            onClick={() => setAutoNext((v) => !v)}
            aria-pressed={autoNext}
          >
            <span className="coach-toggle-track">
              <span className="coach-toggle-thumb" />
            </span>
            Auto mula set seterusnya lepas rest
          </button>

          <div className="coach-controls">
            <button className="focus-adjust" onClick={skipExercise}>
              Skip
            </button>
            <button className="focus-skip" onClick={begin}>
              ▶ Mula set {cur.setNumber}
            </button>
          </div>
        </div>
      )}

      {stage === "rest" && next && (
        <div className="fs-screen">
          <div className="coach-top">
            <button className="focus-icon-btn" onClick={onClose} aria-label="Keluar Mod Fokus">
              <IconClose width={18} height={18} />
            </button>
            <div className="coach-head">
              <div className="coach-eyebrow">Rest</div>
              <div className="coach-title">
                {done.at(-1)?.name} · {done.at(-1)?.reps} reps ✓
              </div>
            </div>
            <span className="focus-icon-btn ghost" />
          </div>

          <div className="coach-ring" style={{ width: RING, height: RING }}>
            <svg width={RING} height={RING} viewBox={`0 0 ${RING} ${RING}`}>
              <circle cx={RING / 2} cy={RING / 2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={STROKE} />
              <circle
                cx={RING / 2}
                cy={RING / 2}
                r={r}
                fill="none"
                stroke="#fff"
                strokeWidth={STROKE}
                strokeLinecap="round"
                strokeDasharray={c}
                strokeDashoffset={c * (1 - (restTotal ? restLeft / restTotal : 0))}
                transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
                style={{ transition: "stroke-dashoffset 0.25s linear" }}
              />
            </svg>
            <div className="coach-center">
              <div className="focus-time">{formatClock(restLeft)}</div>
              <div className="coach-sub">{autoNext ? "lepas ni terus mula" : "rehat"}</div>
            </div>
          </div>

          <div className="fs-next">
            <div className="focus-next-label">Next up · Set {next.setNumber}/{next.totalSets}</div>
            <div className="fs-next-name">{next.exercise.name}</div>
            <WeightStepper value={weightFor(idx + 1)} onChange={(v) => setWeightFor(idx + 1, v)} />
          </div>

          <div className="coach-controls">
            <button className="focus-adjust" onClick={() => adjustRest(-15)} aria-label="Kurang 15 saat">
              −15s
            </button>
            <button className="focus-skip" onClick={skipRest}>
              Mula ▶
            </button>
            <button className="focus-adjust" onClick={() => adjustRest(15)} aria-label="Tambah 15 saat">
              +15s
            </button>
          </div>
        </div>
      )}

      {stage === "complete" && (
        <div className="fs-screen fs-complete">
          <div className="coach-top">
            <span className="focus-icon-btn ghost" />
            <div className="coach-head">
              <div className="coach-eyebrow">Mod Fokus</div>
              <div className="coach-title">{focusLabel} Day</div>
            </div>
            <span className="focus-icon-btn ghost" />
          </div>
          <div className="fs-complete-body">
            <div className="fs-trophy">🏆</div>
            <div className="fs-complete-title">Workout complete</div>
            <div className="fs-stats">
              <div>
                <div className="fs-stat-value">{todaysSets.length}</div>
                <div className="fs-stat-label">Sets</div>
              </div>
              <div>
                <div className="fs-stat-value">{totalVolume.toLocaleString("en-US")}</div>
                <div className="fs-stat-label">kg lifted</div>
              </div>
              <div>
                <div className="fs-stat-value">{exercisesTrained}</div>
                <div className="fs-stat-label">Exercises</div>
              </div>
            </div>
          </div>
          <div className="coach-controls">
            <button className="focus-skip" onClick={onClose}>
              Selesai
            </button>
          </div>
        </div>
      )}
    </div>,
    document.body
  );
}
