import { useCallback, useState } from "react";
import { useLocalStorageState } from "./hooks/useLocalStorageState";
import { STORAGE_KEYS } from "./utils/storage";
import { upsertSet, updateNotes, isPR } from "./utils/sessionOps";
import { makeId } from "./utils/id";
import { todayISO } from "./utils/date";
import BottomNav from "./components/BottomNav";
import PRToastLayer from "./components/PRToastLayer";
import Today from "./screens/Today";
import Progress from "./screens/Progress";
import Weekly from "./screens/Weekly";
import BodyWeight from "./screens/BodyWeight";

export default function App() {
  const [tab, setTab] = useState("today");
  const [sessions, setSessions] = useLocalStorageState(STORAGE_KEYS.SESSIONS, []);
  const [bodyWeight, setBodyWeight] = useLocalStorageState(STORAGE_KEYS.BODY_WEIGHT, []);
  const [fridayPicks, setFridayPicks] = useLocalStorageState(STORAGE_KEYS.FRIDAY_PICKS, {});
  const [toasts, setToasts] = useState([]);

  const showToast = useCallback((message) => {
    const id = makeId();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 1900);
  }, []);

  const handleLogSet = useCallback(
    (exercise, day, setNumber, weight, reps) => {
      const iso = todayISO();
      const wasPR = isPR(sessions, exercise.id, iso, weight, reps);
      setSessions((prev) => upsertSet(prev, { date: iso, day, exerciseId: exercise.id, setNumber, weight, reps }));
      if (wasPR) showToast(`New PR — ${exercise.name}: ${weight}kg × ${reps}`);
      return wasPR;
    },
    [sessions, setSessions, showToast]
  );

  const handleNotesChange = useCallback(
    (exercise, day, notes) => {
      setSessions((prev) => updateNotes(prev, todayISO(), exercise.id, day, notes));
    },
    [setSessions]
  );

  const handleSaveFridayPicks = useCallback(
    (date, picks) => {
      setFridayPicks((prev) => ({ ...prev, [date]: picks }));
    },
    [setFridayPicks]
  );

  const handleAddBodyWeight = useCallback(
    (entry) => {
      setBodyWeight((prev) => {
        const withoutSameDate = prev.filter((e) => e.date !== entry.date);
        return [...withoutSameDate, entry];
      });
    },
    [setBodyWeight]
  );

  return (
    <div className="app-shell">
      <PRToastLayer toasts={toasts} />

      {tab === "today" && (
        <Today
          sessions={sessions}
          onLogSet={handleLogSet}
          onNotesChange={handleNotesChange}
          fridayPicks={fridayPicks}
          onSaveFridayPicks={handleSaveFridayPicks}
          onGoToBodyWeight={() => setTab("bodyweight")}
        />
      )}
      {tab === "progress" && <Progress sessions={sessions} />}
      {tab === "week" && <Weekly sessions={sessions} />}
      {tab === "bodyweight" && <BodyWeight entries={bodyWeight} onAdd={handleAddBodyWeight} />}

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
