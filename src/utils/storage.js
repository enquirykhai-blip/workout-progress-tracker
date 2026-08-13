export const STORAGE_KEYS = {
  SESSIONS: "wpt.sessions.v1",
  BODY_WEIGHT: "wpt.bodyweight.v1",
  FRIDAY_PICKS: "wpt.fridayPicks.v1",
};

export function loadFromStorage(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function saveToStorage(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // localStorage unavailable (private mode / quota) — fail silently, in-memory state still works
  }
}
