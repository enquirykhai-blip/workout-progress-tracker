import { makeId } from "./id";

// Sets can log weight only, reps only, or both — whichever the user actually
// wants to key in. "Best" is tracked in two separate lanes since they aren't
// comparable: a weighted best (by weight, tie-broken by reps) for sets that
// have a weight, and a reps-only best (by reps) for bodyweight-style sets
// logged with no weight.

// Returns { weight, reps, date } of the best *weighted* set logged for an
// exercise before a given date (or across all history if beforeDate is
// omitted). Ignores reps-only sets (weight == null).
export function getBestSet(sessions, exerciseId, beforeDate) {
  let best = null;
  for (const session of sessions) {
    if (session.exerciseId !== exerciseId) continue;
    if (beforeDate && session.date >= beforeDate) continue;
    for (const set of session.sets) {
      if (set.weight == null) continue;
      const reps = set.reps ?? 0;
      if (!best || set.weight > best.weight || (set.weight === best.weight && reps > best.reps)) {
        best = { weight: set.weight, reps, date: session.date };
      }
    }
  }
  return best;
}

// Returns { reps, date } of the best reps-only (no weight) set logged for an
// exercise before a given date, or across all history if beforeDate is omitted.
export function getBestRepsOnlySet(sessions, exerciseId, beforeDate) {
  let best = null;
  for (const session of sessions) {
    if (session.exerciseId !== exerciseId) continue;
    if (beforeDate && session.date >= beforeDate) continue;
    for (const set of session.sets) {
      if (set.weight != null || set.reps == null) continue;
      if (!best || set.reps > best.reps) {
        best = { reps: set.reps, date: session.date };
      }
    }
  }
  return best;
}

export function isPR(sessions, exerciseId, date, weight, reps) {
  if (weight != null) {
    const best = getBestSet(sessions, exerciseId, date);
    if (!best) return weight > 0;
    const r = reps ?? 0;
    if (weight > best.weight) return true;
    if (weight === best.weight && r > best.reps) return true;
    return false;
  }
  // Reps-only set (no weight logged) — compare against other reps-only sets.
  const best = getBestRepsOnlySet(sessions, exerciseId, date);
  if (!best) return reps > 0;
  return reps > best.reps;
}

export function findSession(sessions, date, exerciseId) {
  return sessions.find((s) => s.date === date && s.exerciseId === exerciseId);
}

export function upsertSet(sessions, { date, day, exerciseId, setNumber, weight, reps }) {
  const existing = findSession(sessions, date, exerciseId);
  if (!existing) {
    const session = {
      id: makeId(),
      date,
      day,
      exerciseId,
      notes: "",
      sets: [{ setNumber, weight, reps }],
    };
    return [...sessions, session];
  }
  const sets = existing.sets.some((s) => s.setNumber === setNumber)
    ? existing.sets.map((s) => (s.setNumber === setNumber ? { setNumber, weight, reps } : s))
    : [...existing.sets, { setNumber, weight, reps }];
  sets.sort((a, b) => a.setNumber - b.setNumber);
  return sessions.map((s) => (s.id === existing.id ? { ...s, sets } : s));
}

// Removes a set and renumbers the remaining ones sequentially (1, 2, 3, ...)
// so they stay aligned with the setNumber-indexed rows in the log UI. Drops
// the whole session if that was its last set.
export function removeSet(sessions, sessionId, setNumber) {
  return sessions
    .map((s) => {
      if (s.id !== sessionId) return s;
      const remaining = s.sets
        .filter((set) => set.setNumber !== setNumber)
        .sort((a, b) => a.setNumber - b.setNumber)
        .map((set, i) => ({ ...set, setNumber: i + 1 }));
      return { ...s, sets: remaining };
    })
    .filter((s) => s.sets.length > 0);
}

export function updateNotes(sessions, date, exerciseId, day, notes) {
  const existing = findSession(sessions, date, exerciseId);
  if (!existing) {
    if (!notes) return sessions;
    return [...sessions, { id: makeId(), date, day, exerciseId, notes, sets: [] }];
  }
  return sessions.map((s) => (s.id === existing.id ? { ...s, notes } : s));
}

export function datesWithSessions(sessions) {
  return new Set(sessions.filter((s) => s.sets.length > 0).map((s) => s.date));
}
