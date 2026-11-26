import { useCallback, useEffect, useRef } from "react";

// Shared voice / sound / screen helpers for the Rep Coach and Focus Mode.
// All speech is English.

// ---- Speech: English, preferring a male voice. ----
// Browsers don't expose a voice's gender, so we match the names of the
// common male voices on iOS/macOS, Android (Google) and Windows.
const MALE_VOICE =
  /\b(daniel|aaron|arthur|alex|fred|tom|rishi|oliver|gordon|reed|rocko|eddy|ralph|albert|bruce|david|mark|guy|ryan|christopher|eric|roger|andrew|brian|george|james|william|liam|thomas|male)\b|en-(us|gb|au|in)-x-(iom|iol|tpd|rjs|gbd|aud|ene)/i;

function pickVoice() {
  const voices = (window.speechSynthesis?.getVoices?.() || []).filter((v) => /^en/i.test(v.lang));
  const male = voices.filter((v) => MALE_VOICE.test(`${v.name} ${v.voiceURI || ""}`));
  const byLocal = (list) => list.find((v) => v.localService) || list[0];
  const preferred = (list) =>
    byLocal(list.filter((v) => /^en-(gb|us)/i.test(v.lang))) || byLocal(list);
  const voice = preferred(male);
  if (voice) return { voice, pitch: 0.95 };
  // No male voice installed: use any English voice, pitched down.
  return { voice: preferred(voices) || null, pitch: 0.72 };
}

export function useSpeech(enabled) {
  const voiceRef = useRef(null);
  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => (voiceRef.current = pickVoice());
    load();
    window.speechSynthesis.addEventListener?.("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", load);
  }, []);

  const say = useCallback(
    (text, { interrupt = true } = {}) => {
      if (!enabled || !("speechSynthesis" in window)) return;
      const v = voiceRef.current || pickVoice();
      const u = new SpeechSynthesisUtterance(text);
      if (v.voice) u.voice = v.voice;
      u.lang = v.voice?.lang || "en-US";
      u.pitch = v.pitch;
      u.rate = 1.02;
      if (interrupt) window.speechSynthesis.cancel();
      window.speechSynthesis.speak(u);
    },
    [enabled]
  );

  const stop = useCallback(() => window.speechSynthesis?.cancel(), []);
  return { say, stop };
}

// ---- Ticks via Web Audio (works offline, no files). ----
// One AudioContext for the whole app: iOS only lets audio start from a tap,
// so once it's unlocked by the first "Start" it stays usable for the
// auto-started sets that follow in Focus Mode.
let sharedCtx = null;
export function unlockAudio() {
  if (!sharedCtx) {
    const Ctx = window.AudioContext || window.webkitAudioContext;
    if (Ctx) sharedCtx = new Ctx();
  }
  sharedCtx?.resume?.();
}

export function useTicks(enabled = true) {
  const tick = useCallback(
    (freq, dur = 0.08, vol = 0.18) => {
      const ctx = sharedCtx;
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
  return { unlock: unlockAudio, tick };
}

// ---- Keep the screen awake while active. ----
export function useWakeLock(active) {
  useEffect(() => {
    if (!active || !("wakeLock" in navigator)) return;
    let lock = null;
    let cancelled = false;
    const request = async () => {
      try {
        lock = await navigator.wakeLock.request("screen");
      } catch {
        // denied (battery saver etc.) — everything still works
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
