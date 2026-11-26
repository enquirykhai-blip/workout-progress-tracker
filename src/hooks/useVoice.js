import { useCallback, useEffect, useRef } from "react";

// Shared voice / sound / screen helpers for the Rep Coach and Focus Mode.

const MS_ONES = ["", "satu", "dua", "tiga", "empat", "lima", "enam", "tujuh", "lapan", "sembilan"];
export function malayNumber(n) {
  if (n <= 0) return "kosong";
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
// One AudioContext for the whole app: iOS only lets audio start from a tap,
// so once it's unlocked by the first "Mula" it stays usable for the
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
