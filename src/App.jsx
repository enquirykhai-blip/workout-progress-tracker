import { useCallback, useState } from "react";
import { useCloudState } from "./hooks/useCloudState";
import { useAuth } from "./hooks/useAuth";
import { useRestTimer } from "./hooks/useRestTimer";
import { STORAGE_KEYS } from "./utils/storage";
import { upsertSet, updateNotes, isPR } from "./utils/sessionOps";
import { makeId } from "./utils/id";
import { todayISO } from "./utils/date";
import BottomNav from "./components/BottomNav";
import PRToastLayer from "./components/PRToastLayer";
import AuthScreen from "./components/AuthScreen";
import RestTimerBar from "./components/RestTimerBar";
import Today from "./screens/Today";
import Progress from "./screens/Progress";
import Weekly from "./screens/Weekly";
import BodyWeight from "./screens/BodyWeight";

export default function App() {
  const { user, loading, signIn, signUp, signOut } = useAuth();

  if (loading) return <div className="app-shell" />;
  if (!user) return <AuthScreen signIn={signIn} signUp={signUp} />;

  return <WorkoutApp uid={user.uid} email={user.email} onSignOut={signOut} />;
}

function WorkoutApp({ uid, email, onSignOut }) {
  const [tab, setTab] = useState("today");
  const [sessions, setSessions] = useCloudState(STORAGE_KEYS.SESSIONS, "sessions", [], uid);
  const [bodyWeight, setBodyWeight] = useCloudState(STORAGE_KEYS.BODY_WEIGHT, "bodyweight", [], uid);
  const [fridayPicks, setFridayPicks] = useCloudState(STORAGE_KEYS.FRIDAY_PICKS, "fridayPicks", {}, uid);
  const [toasts, setToasts] = useState([]);
  const [accountOpen, setAccountOpen] = useState(false);
  const restTimer = useRestTimer();

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
      if (wasPR) {
        const detail = weight != null ? `${weight}kg${reps ? ` × ${reps}` : ""}` : `${reps} reps`;
        showToast(`New PR — ${exercise.name}: ${detail}`);
      }
      restTimer.start(restTimer.defaultDuration);
      return wasPR;
    },
    [sessions, setSessions, showToast, restTimer]
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

      <button className="account-fab" onClick={() => setAccountOpen((v) => !v)} aria-label="Account">
        {email?.[0]?.toUpperCase() || "?"}
      </button>
      {accountOpen && (
        <div className="account-popover">
          <div className="account-email">{email}</div>
          <div className="account-section-label">Rest Timer</div>
          <div className="chip-row" style={{ marginBottom: 14 }}>
            {restTimer.presets.map((secs) => (
              <button
                key={secs}
                className={`chip${restTimer.defaultDuration === secs ? " active" : ""}`}
                onClick={() => restTimer.setDefaultDuration(secs)}
              >
                {secs}s
              </button>
            ))}
          </div>
          <button className="btn btn-secondary btn-block" onClick={onSignOut}>
            Sign Out
          </button>
        </div>
      )}

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

      <RestTimerBar
        active={restTimer.active}
        remaining={restTimer.remaining}
        addSeconds={restTimer.addSeconds}
        skip={restTimer.skip}
      />
      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
