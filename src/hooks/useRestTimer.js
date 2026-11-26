import { useLocalStorageState } from "./useLocalStorageState";
import { STORAGE_KEYS } from "../utils/storage";

// "auto" = use the current program's planned rest (see PROGRAMS in data/exercises).
// Few choices, decided fast — four covers every real case.
const DURATION_PRESETS = ["auto", 60, 120, 180];

// The rest-length preference (per device, not synced). The countdowns
// themselves live per exercise — see useExerciseTimers.
export function useRestTimer() {
  const [savedDuration, setDefaultDuration] = useLocalStorageState(STORAGE_KEYS.REST_DURATION, "auto");
  // A value saved before the preset list shrank (90s / 240s) falls back to Auto.
  const defaultDuration = DURATION_PRESETS.includes(savedDuration) ? savedDuration : "auto";

  return { defaultDuration, setDefaultDuration, presets: DURATION_PRESETS };
}

// Seconds to rest for a program, honouring the user's preference.
export function resolveRestSeconds(preference, programRestSeconds = 120) {
  return preference === "auto" ? programRestSeconds : preference;
}
