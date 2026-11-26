import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { IconClose } from "./icons";
import { haptic } from "../utils/motion";
import { useLocalStorageState } from "../hooks/useLocalStorageState";
import { STORAGE_KEYS } from "../utils/storage";

// Hands-free rep counter. Paces every rep on the plan's tempo (lift → hold &
// squeeze → lower), ticks at each phase change, and says the rep number out
// loud when a rep completes — so you never lose count mid-set. Finishing
// hands the count back to the exercise card, which fills REPS (and logs the
// set if a weight is already entered).

// Phase lengths in seconds: [lift, hold & squeeze, lower].
const TEMPOS = {
  plan: { label: "Tahan 4s", phases: [1.5, 4, 2] },
  medium: { label: "Tahan 2s", phases: [1.5, 2, 2] },
  fast: { label: "Tanpa tahan", phases: [1, 0, 1.5] },
};

const PHASE_LABEL = ["Angkat", "Tahan & squeeze", "Turun"];
// What the voice says at the start of each phase (Malay / English).
const PHASE_CUE_MS = ["angkat", "tahan, squeeze", "turun"];
const PHASE_CUE_EN = ["lift", "hold, squeeze", "lower"];
const PHASE_TONE = [880, 660, 440];
const COUNTDOWN_S = 3;

const MS_ONES = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "lapan", "sembilan"];
function malayNumber(n) {
  if (n < 10) return MS_ONES[n];
  if (n === 10) return "sepuluh";
  if (n === 11) return "sebelas";
  if (n < 20) return `${MS_ONES[n - 10]} belas`;
  const tens = Math.floor(n / 10);
  const rest = n % 10;
  return `${MS_ONES[tens]} puluh${rest ? ` ${MS_ONES[rest]}` : ""}`;
}

// ---- Speech: Malay when the phone has a Malay voice, English otherwise. ----
function pickVoice() {
  const voices = window.speechSynthesis?.getVoices?.() || [];
  const ms = voices.find((v) => /^ms|^id/i.test(v.lang));
  if (ms) return { voice: ms, malay: true };
  const en = voices.find((v) => /^en/i.test(v.lang));
  return { voice: en || null, malay: false };
}

function useSpeech(enabled) {
  const voiceRef = useRef(null);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => (voiceRef.current = pickVoice());
    load();
    window.speechSynthesis.addEventListener?.("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", load);
  }, []);

  const say = useCallback(
    (ms, en, { interrupt = true } = {}) => {
      if (!enabled || !("speechSynthesis" in window)) return;
      const v = voiceRef.current || pickVoice();
      const u = new SpeechSynthesisUtterance(v.malay ? ms : en);
      if (v.voice) {
        u.voice = v.voice;
        u.lang = v.voice.lang;
      }
      u.rate = 1.05;
      if (interrupt) window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    },
    [enabled]
  );

  const stop = useCallback(() => window.speechSynthesis?.cancel(), []);
  return { say, stop };
}

// ---- Ticks via Web Audio (works offline, no files). ----
function useTicks(enabled) {
  const ctxRef = useRef(null);
  const unlock = useCallback(() => {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      if (Ctx) ctxRef.current = new Ctx();
    }
    ctxRef.current?.resume?.();
  }, []);
  const tick = useCallback(
    (freq, dur = 0.08, vol = 0.18) => {
      const ctx = ctxRef.current;
      if (!enabled || !ctx) return;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = freq;
      const t = ctx.currentTime;
      gain.gain.setValueAtTime(0.0001, t);
      gain.gain.exponentialRampToValueAtTime(vol, t + 0.01);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t);
      osc.stop(t + dur + 0.02);
    },
    [enabled]
  );
  useEffect(() => () => ctxRef.current?.close?.(), []);
  return { unlock, tick };
}

// ---- Keep the screen awake while counting. ----
function useWakeLock(active) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock = null;
    let cancelled = false;
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        // denied (battery saver etc.) — counting still works
      }
    };
    const onVisible = () => !cancelled && document.visibilityState === "visible" && request();
    request();
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener("visibilitychange", onVisible);
      lock?.release?.().catch(() => {});
    };
  }, [active]);
}

const RING = 248;
const STROKE = 10;

export default function RepCoach({ exerciseName, setNumber, totalSets, targetReps = 15, weight, onFinish, onClose }) {
  const [tempoKey, setTempoKey] = useLocalStorageState(STORAGE_KEYS.REP_TEMPO, "plan");
  const [voiceOn, setVoiceOn] = useLocalStorageState(STORAGE_KEYS.REP_VOICE, true);
  // Speak "angkat / tahan, squeeze / turun" at every phase, not just numbers.
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
      say(`${malayNumber(n)}. Siap!`, `${n}. Done!`);
      tick(1046, 0.25, 0.22);
      setStatus("done");
      return false;
    }
    // The rep number and the next "angkat" land at the same instant, so they
    // go out as one utterance instead of cutting each other off.
    const cueMs = phaseCues ? `, ${PHASE_CUE_MS[0]}` : "";
    const cueEn = phaseCues ? `, ${PHASE_CUE_EN[0]}` : "";
    if (left === 2) say(`${malayNumber(n)}. Dua lagi${cueMs}!`, `${n}. Two more${cueEn}!`);
    else say(`${malayNumber(n)}${cueMs}`, `${n}${cueEn}`);
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
        // "tahan, squeeze" / "turun" — queued (not interrupting) so the rep
        // number before it is never cut short. "angkat" rides with the number.
        if (phaseCues && next !== 0) say(PHASE_CUE_MS[next], PHASE_CUE_EN[next], { interrupt: false });
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
      say(phaseCues ? "Mula. Angkat!" : "Mula!", phaseCues ? "Go. Lift!" : "Go!");
      eng.current.phase = 0;
      eng.current.phaseStart = performance.now();
      setPhase(0);
      setPhaseProgress(0);
      tick(PHASE_TONE[0]);
      setStatus("running");
      return;
    }
    say(malayNumber(countdown), String(countdown), { interrupt: false });
    tick(520, 0.06, 0.12);
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [status, countdown, say, tick, phaseCues]);

  useEffect(() => () => stopSpeech(), [stopSpeech]);

  function start() {
    unlock(); // audio + speech must be started from a tap on iOS
    say("Sedia", "Ready");
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
    setGoal((g) => Math.max(g, eng.current.reps) + 5);
    eng.current.phase = 0;
    eng.current.phaseStart = performance.now();
    setPhase(0);
    say(phaseCues ? "Teruskan. Angkat!" : "Teruskan!", phaseCues ? "Keep going. Lift!" : "Keep going!");
    setStatus("running");
  }

  function adjust(delta) {
    const n = Math.max(0, eng.current.reps + delta);
    eng.current.reps = n;
    setReps(n);
  }

  const r = (RING - STROKE) / 2;
  const c = 2 * Math.PI * r;
  const setPct = goal ? Math.min(reps / goal, 1) : 0;
  const counting = status === "running" || status === "paused";

  return createPortal(
    <div className={`coach coach-${status}`} role="dialog" aria-label="Rep coach">
      <div className="coach-top">
        <button className="focus-icon-btn" onClick={onClose} aria-label="Tutup">
          <IconClose width={18} height={18} />
        </button>
        <div className="coach-head">
          <div className="coach-eyebrow">
            Set {setNumber}
            {totalSets ? ` of ${totalSets}` : ""} · Target {targetReps}
          </div>
          <div className="coach-title">{exerciseName}</div>
        </div>
        <button
          className={`focus-icon-btn coach-voice${voiceOn ? " on" : ""}`}
          onClick={() => setVoiceOn((v) => !v)}
          aria-label={voiceOn ? "Matikan suara" : "Hidupkan suara"}
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
              <div className="coach-sub">reps · ikut tempo</div>
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
              <div className="coach-sub">{status === "done" ? "reps siap" : `of ${goal}`}</div>
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
          Sebut fasa (angkat · tahan · turun)
        </button>
      )}

      {status === "done" && (
        <div className="coach-adjust">
          <button className="focus-adjust" onClick={() => adjust(-1)} aria-label="Tolak satu rep">
            −1
          </button>
          <div className="coach-adjust-note">{weight ? `${weight}kg × ${reps}` : "Betulkan kalau perlu"}</div>
          <button className="focus-adjust" onClick={() => adjust(1)} aria-label="Tambah satu rep">
            +1
          </button>
        </div>
      )}

      <div className="coach-controls">
        {status === "ready" && (
          <button className="focus-skip coach-main" onClick={start}>
            ▶ Mula
          </button>
        )}
        {status === "countdown" && (
          <button className="focus-adjust coach-main" onClick={() => setStatus("ready")}>
            Batal
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
                ▶ Sambung
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
              + Teruskan
            </button>
            <button className="focus-skip" onClick={() => onFinish(reps)} disabled={reps === 0}>
              {weight ? "Simpan set" : "Isi reps"}
            </button>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
