import { makeId } from "./id";

// Returns { weight, reps } of the best set logged for an exercise before a given date
// (or across all history if beforeDate is omitted). "Best" = highest weight, tie-broken by reps.
export function getBestSet(sessions, exerciseId, beforeDate) {
  let best = null;
  for (const session of sessions) {
    if (session.exerciseId !== exerciseId) continue;
    if (beforeDate && session.date >= beforeDate) continue;
    for (const set of session.sets) {
      if (set.weight == null || set.reps == null) continue;
      if (
        !best ||
        set.weight > best.weight ||
        (set.weight === best.weight && set.reps > best.reps)
      ) {
        best = { weight: set.weight, reps: set.reps, date: session.date };
      }
    }
  }
  return best;
}

export function isPR(sessions, exerciseId, date, weight, reps) {
  const best = getBestSet(sessions, exerciseId, date);
  if (!best) return weight > 0;
  if (weight > best.weight) return true;
  if (weight === best.weight && reps > best.reps) return true;
  return false;
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

export function removeSet(sessions, sessionId, setNumber) {
  return sessions
    .map((s) => {
      if (s.id !== sessionId) return s;
      return { ...s, sets: s.sets.filter((set) => set.setNumber !== setNumber) };
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

export function sessionsForExercise(sessions, exerciseId) {
  return sessions
    .filter((s) => s.exerciseId === exerciseId && s.sets.length > 0)
    .slice()
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function maxWeightInSession(session) {
  return session.sets.reduce((max, s) => Math.max(max, s.weight || 0), 0);
}

export function datesWithSessions(sessions) {
  return new Set(sessions.filter((s) => s.sets.length > 0).map((s) => s.date));
}
