import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconClose } from "./icons";
import { haptic } from "../utils/motion";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { STORAGE_KEYS } from "../utils/storage";
import { useSpeech, useTicks, useWakeLock } from "../hooks/useVoice";

// Hands-free rep counter. Paces every rep on the plan's tempo (lift → hold &
// squeeze → lower), ticks at each phase change, and says the rep number out
// loud when a rep completes — so you never lose count mid-set. Finishing
// hands the count back to the exercise card, which fills REPS (and logs the
// set if a weight is already entered).

// Phase lengths in seconds: [lift, hold & squeeze, lower].
const TEMPOS = {
  plan: { label: "Hold 4s", phases: [1.5, 4, 2] },
  medium: { label: "Hold 2s", phases: [1.5, 2, 2] },
  fast: { label: "No hold", phases: [1, 0, 1.5] },
};

const PHASE_LABEL = ["Lift", "Hold & squeeze", "Lower"];
// What the voice says at the start of each phase.
const PHASE_CUE = ["lift", "hold, squeeze", "lower"];
const PHASE_TONE = [880, 660, 440];
const COUNTDOWN_S = 3;

const RING = 248;
const STROKE = 10;

// Props for Focus Mode: `embedded` renders inline (the session owns the
// overlay), `autoStart` skips the ready screen, `autoSaveMs` saves the count
// on its own shortly after "Done!" unless the user adjusts it, and
// `eyebrow` replaces the "Set n of m" line.
export default function RepCoach({
  exerciseName,
  setNumber,
  totalSets,
  targetReps = 15,
  weight,
  onFinish,
  onClose,
  embedded = false,
  autoStart = false,
  autoSaveMs = 0,
  eyebrow,
}) {
  const [tempoKey, setTempoKey] = useLocalStorageState(STORAGE_KEYS.REP_TEMPO, "plan");
  const [voiceOn, setVoiceOn] = useLocalStorageState(STORAGE_KEYS.REP_VOICE, true);
  // Speak "lift / hold, squeeze / lower" at every phase, not just numbers.
  const [phaseCues, setPhaseCues] = useLocalStorageState(STORAGE_KEYS.REP_PHASE_CUES, true);
  const tempo = TEMPOS[tempoKey] || TEMPOS.plan;

  // status: ready | countdown | running | paused | done
  const [status, setStatus] = useState("ready");
  const [reps, setReps] = useState(0);
  const [phase, setPhase] = useState(0);
  const [phaseProgress, setPhaseProgress] = useState(0);
  const [countdown, setCountdown] = useState(COUNTDOWN_S);
  const [goal, setGoal] = useState(targetReps);
  const [bump, setBump] = useState(0);

  const { say, stop: stopSpeech } = useSpeech(voiceOn);
  const { unlock, tick } = useTicks(true);
  const [autoSaveLeft, setAutoSaveLeft] = useState(null);
  useWakeLock(status === "countdown" || status === "running" || status === "paused");

  // Mutable engine state so the animation loop doesn't re-subscribe.
  const eng = useRef({ phase: 0, phaseStart: 0, reps: 0, pausedAt: 0 });
  const raf = useRef(0);

  const phases = tempo.phases;

  const completeRep = useCallback(() => {
    const n = eng.current.reps + 1;
    eng.current.reps = n;
    setReps(n);
    setBump((b) => b + 1);
    haptic(15);
    const left = goal - n;
    if (n >= goal) {
      say(`${n}. Done!`);
      tick(1046, 0.25, 0.22);
      setStatus("done");
      return false;
    }
    // The rep number and the next "lift" land at the same instant, so they
    // go out as one utterance instead of cutting each other off.
    const cue = phaseCues ? `, ${PHASE_CUE[0]}` : "";
    if (left === 2) say(`${n}. Two more${cue}!`);
    else say(`${n}${cue}`);
    return true;
  }, [goal, say, tick, phaseCues]);

  // Main loop: advance phases on the clock.
  useEffect(() => {
    if (status !== "running") return;
    const loop = (now) => {
      const e = eng.current;
      const len = phases[e.phase] * 1000;
      const elapsed = now - e.phaseStart;
      if (elapsed >= len) {
        // Next phase, skipping any 0-second phase (e.g. no hold).
        let next = e.phase + 1;
        while (next <= 2 && phases[next] === 0) next += 1;
        if (next > 2) {
          if (!completeRep()) return; // set finished
          next = 0;
        }
        e.phase = next;
        e.phaseStart = now;
        setPhase(next);
        setPhaseProgress(0);
        tick(PHASE_TONE[next]);
        // "hold, squeeze" / "lower" — queued (not interrupting) so the rep
        // number before it is never cut short. "lift" rides with the number.
        if (phaseCues && next !== 0) say(PHASE_CUE[next], { interrupt: false });
      } else {
        setPhaseProgress(len ? elapsed / len : 1);
      }
      raf.current = requestAnimationFrame(loop);
    };
    raf.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf.current);
  }, [status, phases, completeRep, tick, phaseCues, say]);

  // 3-2-1 countdown.
  useEffect(() => {
    if (status !== "countdown") return;
    if (countdown === 0) {
      say(phaseCues ? "Go. Lift!" : "Go!");
      eng.current.phase = 0;
      eng.current.phaseStart = performance.now();
      setPhase(0);
      setPhaseProgress(0);
      tick(PHASE_TONE[0]);
      setStatus("running");
      return;
    }
    say(String(countdown), { interrupt: false });
    tick(520, 0.06, 0.12);
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [status, countdown, say, tick, phaseCues]);

  useEffect(() => () => stopSpeech(), [stopSpeech]);

  // Focus Mode: begin counting straight away.
  const started = useRef(false);
  useEffect(() => {
    if (autoStart && !started.current) {
      started.current = true;
      start();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoStart]);

  // Focus Mode: save the count a moment after "Done!" unless the user
  // touches −1/+1/Keep going first.
  const [autoSaveOff, setAutoSaveOff] = useState(false);
  useEffect(() => {
    if (status !== "done" || !autoSaveMs || autoSaveOff) {
      setAutoSaveLeft(null);
      return;
    }
    const end = Date.now() + autoSaveMs;
    setAutoSaveLeft(Math.ceil(autoSaveMs / 1000));
    const iv = setInterval(() => {
      const left = Math.ceil((end - Date.now()) / 1000);
      if (left <= 0) {
        clearInterval(iv);
        onFinish(eng.current.reps);
      } else setAutoSaveLeft(left);
    }, 200);
    return () => clearInterval(iv);
  }, [status, autoSaveMs, autoSaveOff, onFinish]);

  function start() {
    unlock(); // audio + speech must be started from a tap on iOS
    say("Ready");
    eng.current = { phase: 0, phaseStart: 0, reps: 0, pausedAt: 0 };
    setReps(0);
    setGoal(targetReps);
    setCountdown(COUNTDOWN_S);
    setStatus("countdown");
  }

  function pause() {
    eng.current.pausedAt = performance.now();
    stopSpeech();
    setStatus("paused");
  }

  function resume() {
    unlock();
    eng.current.phaseStart += performance.now() - eng.current.pausedAt;
    setStatus("running");
  }

  function finishNow() {
    stopSpeech();
    setStatus("done");
  }

  function keepGoing() {
    unlock();
    setAutoSaveOff(true);
    setGoal((g) => Math.max(g, eng.current.reps) + 5);
    eng.current.phase = 0;
    eng.current.phaseStart = performance.now();
    setPhase(0);
    say(phaseCues ? "Keep going. Lift!" : "Keep going!");
    setStatus("running");
  }

  function adjust(delta) {
    setAutoSaveOff(true);
    const n = Math.max(0, eng.current.reps + delta);
    eng.current.reps = n;
    setReps(n);
  }

  const r = (RING - STROKE) / 2;
  const c = 2 * Math.PI * r;
  const setPct = goal ? Math.min(reps / goal, 1) : 0;
  const counting = status === "running" || status === "paused";

  const view = (
    <div className={`coach coach-${status}${embedded ? " coach-embedded" : ""}`} role="dialog" aria-label="Rep coach">
      <div className="coach-top">
        <button className="focus-icon-btn" onClick={onClose} aria-label="Close">
          <IconClose width={18} height={18} />
        </button>
        <div className="coach-head">
          <div className="coach-eyebrow">
            {eyebrow || (
              <>
                Set {setNumber}
                {totalSets ? ` of ${totalSets}` : ""} · Target {targetReps}
              </>
            )}
          </div>
          <div className="coach-title">{exerciseName}</div>
        </div>
        <button
          className={`focus-icon-btn coach-voice${voiceOn ? " on" : ""}`}
          onClick={() => setVoiceOn((v) => !v)}
          aria-label={voiceOn ? "Mute voice" : "Unmute voice"}
          aria-pressed={voiceOn}
        >
          {voiceOn ? "🔊" : "🔇"}
        </button>
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
            strokeDashoffset={c * (1 - setPct)}
            transform={`rotate(-90 ${RING / 2} ${RING / 2})`}
            style={{ transition: "stroke-dashoffset 0.5s cubic-bezier(0.32, 0.72, 0, 1)" }}
          />
        </svg>
        <div className="coach-center">
          {status === "ready" && (
            <>
              <div className="coach-big">{targetReps}</div>
              <div className="coach-sub">reps · on tempo</div>
            </>
          )}
          {status === "countdown" && (
            <div className="coach-big coach-count" key={countdown}>
              {countdown || "GO"}
            </div>
          )}
          {(counting || status === "done") && (
            <>
              <div className="coach-big" key={bump}>
                {reps}
              </div>
              <div className="coach-sub">{status === "done" ? "reps done" : `of ${goal}`}</div>
            </>
          )}
        </div>
      </div>

      {counting && (
        <div className="coach-phase">
          <div className="coach-phase-label">{status === "paused" ? "Pause" : PHASE_LABEL[phase]}</div>
          <div className="coach-phase-bars">
            {[0, 1, 2].map((p) =>
              phases[p] > 0 ? (
                <span key={p} className={`coach-bar${p < phase ? " full" : ""}`}>
                  <span style={{ transform: `scaleX(${p === phase ? phaseProgress : p < phase ? 1 : 0})` }} />
                </span>
              ) : null
            )}
          </div>
        </div>
      )}

      {status === "ready" && (
        <div className="coach-tempo">
          {Object.entries(TEMPOS).map(([key, t]) => (
            <button key={key} className={`coach-chip${tempoKey === key ? " active" : ""}`} onClick={() => setTempoKey(key)}>
              {t.label}
            </button>
          ))}
        </div>
      )}

      {status === "ready" && (
        <button
          className={`coach-toggle${phaseCues ? " on" : ""}`}
          onClick={() => setPhaseCues((v) => !v)}
          aria-pressed={phaseCues}
        >
          <span className="coach-toggle-track">
            <span className="coach-toggle-thumb" />
          </span>
          Call out phases (lift · hold · lower)
        </button>
      )}

      {status === "done" && (
        <div className="coach-adjust">
          <button className="focus-adjust" onClick={() => adjust(-1)} aria-label="Remove one rep">
            −1
          </button>
          <div className="coach-adjust-note">{weight ? `${weight}kg × ${reps}` : "Adjust if needed"}</div>
          <button className="focus-adjust" onClick={() => adjust(1)} aria-label="Add one rep">
            +1
          </button>
        </div>
      )}

      <div className="coach-controls">
        {status === "ready" && (
          <button className="focus-skip coach-main" onClick={start}>
            ▶ Start
          </button>
        )}
        {status === "countdown" && (
          <button className="focus-adjust coach-main" onClick={() => setStatus("ready")}>
            Cancel
          </button>
        )}
        {counting && (
          <>
            {status === "running" ? (
              <button className="focus-adjust" onClick={pause}>
                ❚❚ Pause
              </button>
            ) : (
              <button className="focus-adjust" onClick={resume}>
                ▶ Resume
              </button>
            )}
            <button className="focus-skip" onClick={finishNow}>
              Stop · {reps}
            </button>
          </>
        )}
        {status === "done" && (
          <>
            <button className="focus-adjust" onClick={keepGoing}>
              + Keep going
            </button>
            <button className="focus-skip" onClick={() => onFinish(reps)} disabled={reps === 0}>
              {weight ? "Save set" : "Fill reps"}
              {autoSaveLeft != null && !autoSaveOff ? ` · ${autoSaveLeft}` : ""}
            </button>
          </>
        )}
      </div>
    </div>
  );

  return embedded ? view : createPortal(view, document.body);
}
