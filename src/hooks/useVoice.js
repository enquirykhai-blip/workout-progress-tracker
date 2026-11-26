import { useCallback, useEffect } from "react";

// Shared voice / sound / screen helpers for the Rep Coach and Focus Mode.
// All speech is English.

// ---- Speech: English, a clear male voice by default. ----
// Browsers don't expose a voice's gender or quality, so voices are ranked by
// name: high-quality ("Enhanced", "Premium", "Neural", "Natural", online
// Google voices) first, then known male voices, then en-GB/en-US. Apple's
// novelty voices (Fred, Eddy, Reed, Rocko, Zarvox, …) sound robotic and are
// never picked automatically. The user can also choose a voice in Settings.

const VOICE_PREF_KEY = "wpt.coachVoice.v1";

const NOVELTY =
  /\b(fred|albert|bad news|bahh|bells|boing|bubbles|cellos|good news|jester|organ|superstar|trinoids|whisper|wobble|zarvox|junior|ralph|bruce|eddy|reed|rocko|grandpa|grandma|sandy|shelley|flo|kathy|vicki|victoria|princess|deranged|hysterical|pipe organ)\b/i;
const QUALITY = /enhanced|premium|neural|natural|online|wavenet|studio|siri/i;
const MALE =
  /\b(daniel|aaron|arthur|oliver|gordon|rishi|evan|nathan|tom|alex|david|mark|guy|ryan|christopher|eric|roger|andrew|brian|george|james|william|liam|thomas|male)\b|en-(us|gb|au|in)-x-(iom|iol|tpd|rjs|gbd|aud|ene)/i;

function englishVoices() {
  return (window.speechSynthesis?.getVoices?.() || []).filter((v) => /^en/i.test(v.lang));
}

function scoreVoice(v) {
  const id = `${v.name} ${v.voiceURI || ""}`;
  if (NOVELTY.test(id)) return -100;
  let score = 0;
  if (QUALITY.test(id)) score += 40;
  if (MALE.test(id)) score += 25;
  if (/^en-(gb|us)/i.test(v.lang)) score += 6;
  if (/^en-(au|ie|ca)/i.test(v.lang)) score += 3;
  if (v.localService) score += 2;
  return score;
}

// English voices, best first — used by the Settings voice picker.
export function rankedVoices() {
  return englishVoices()
    .map((v) => ({ voice: v, score: scoreVoice(v) }))
    .filter((x) => x.score > -100)
    .sort((a, b) => b.score - a.score)
    .map((x) => x.voice);
}

export function getVoicePreference() {
  try {
    return JSON.parse(localStorage.getItem(VOICE_PREF_KEY)) || "";
  } catch {
    return "";
  }
}

export function setVoicePreference(name) {
  try {
    localStorage.setItem(VOICE_PREF_KEY, JSON.stringify(name || ""));
  } catch {
    // storage unavailable — falls back to auto
  }
}

function pickVoice() {
  const chosen = getVoicePreference();
  if (chosen) {
    const match = englishVoices().find((v) => v.name === chosen);
    if (match) return match;
  }
  return rankedVoices()[0] || null;
}

// Speak once with the given (or auto) voice — used by the "Test" button.
export function speakSample(text, voiceName) {
  if (!("speechSynthesis" in window)) return;
  const v = (voiceName && englishVoices().find((x) => x.name === voiceName)) || pickVoice();
  const u = new SpeechSynthesisUtterance(text);
  if (v) u.voice = v;
  u.lang = v?.lang || "en-US";
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(u);
}

export function useSpeech(enabled) {
  const say = useCallback(
    (text, { interrupt = true } = {}) => {
      if (!enabled || !("speechSynthesis" in window)) return;
      // Resolved on every line, so a voice picked in Settings applies at once.
      const v = pickVoice();
      const u = new SpeechSynthesisUtterance(text);
      if (v) u.voice = v;
      u.lang = v?.lang || "en-US";
      // Natural pitch and pace — bending either makes voices sound robotic.
      u.pitch = 1;
      u.rate = 1;
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
