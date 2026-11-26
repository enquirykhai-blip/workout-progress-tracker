import { useEffect, useState } from "react";
import { rankedVoices, getVoicePreference, setVoicePreference, speakSample } from "../hooks/useVoice";

const SAMPLE = "Ready. 3, 2, 1. Go, lift! Hold, squeeze. Lower. 2, lift.";

// Settings control: pick the coach's voice from the English voices on this
// device (best first), and hear it with "Test". "Auto" picks the clearest
// male voice available.
export default function VoicePicker() {
  const [voices, setVoices] = useState(() => (typeof window !== "undefined" ? rankedVoices() : []));
  const [choice, setChoice] = useState(getVoicePreference);

  useEffect(() => {
    if (!("speechSynthesis" in window)) return;
    const load = () => setVoices(rankedVoices());
    load();
    window.speechSynthesis.addEventListener?.("voiceschanged", load);
    return () => window.speechSynthesis.removeEventListener?.("voiceschanged", load);
  }, []);

  if (!("speechSynthesis" in window)) return null;

  const autoName = voices[0]?.name;

  return (
    <div className="voice-picker">
      <select
        className="voice-select"
        value={choice}
        onChange={(e) => {
          setChoice(e.target.value);
          setVoicePreference(e.target.value);
          speakSample("Ready. Go, lift!", e.target.value);
        }}
        aria-label="Coach voice"
      >
        <option value="">Auto{autoName ? ` (${autoName})` : ""}</option>
        {voices.map((v) => (
          <option key={`${v.name}-${v.lang}`} value={v.name}>
            {v.name} · {v.lang}
          </option>
        ))}
      </select>
      <button className="chip voice-test" onClick={() => speakSample(SAMPLE, choice)}>
        ▶ Test
      </button>
    </div>
  );
}
