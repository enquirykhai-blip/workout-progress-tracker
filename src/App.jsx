import { useCallback, useState } from "react";
import { useCloudState } from "./hooks/useCloudState";
import { useAuth } from "./hooks/useAuth";
import { useRestTimer } from "./hooks/useRestTimer";
import { STORAGE_KEYS } from "./utils/storage";
import { upsertSet, updateNotes, isPR, findSession, removeSet } from "./utils/sessionOps";
import { makeId } from "./utils/id";
import { todayISO } from "./utils/date";
import BottomNav from "./components/BottomNav";
import PRToastLayer from "./components/PRToastLayer";
import AuthScreen from "./components/AuthScreen";
import RestTimerBar from "./components/RestTimerBar";
import Today from "./screens/Today";
import Weekly from "./screens/Weekly";
import Nutrition from "./screens/Nutrition";

export default function App() {
  const { user, loading, signIn, signUp, signOut } = useAuth();

  if (loading) return <div className="app-shell" />;
  if (!user) return <AuthScreen signIn={signIn} signUp={signUp} />;

  return <WorkoutApp uid={user.uid} email={user.email} onSignOut={signOut} />;
}

function WorkoutApp({ uid, email, onSignOut }) {
  const [tab, setTab] = useState("today");
  const [sessions, setSessions] = useCloudState(STORAGE_KEYS.SESSIONS, "sessions", [], uid);
  const [fridayPicks, setFridayPicks] = useCloudState(STORAGE_KEYS.FRIDAY_PICKS, "fridayPicks", {}, uid);
  const [nutrition, setNutrition] = useCloudState(STORAGE_KEYS.NUTRITION, "nutrition", [], uid);
  const [nutritionTargets, setNutritionTargets] = useCloudState(
    STORAGE_KEYS.NUTRITION_TARGETS,
    "nutritionTargets",
    { calories: 2200, protein: 150, carbs: 250, fat: 70, fiber: 30 },
    uid
  );
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

  const handleDeleteSet = useCallback(
    (exercise, setNumber) => {
      const iso = todayISO();
      setSessions((prev) => {
        const session = findSession(prev, iso, exercise.id);
        if (!session) return prev;
        return removeSet(prev, session.id, setNumber);
      });
    },
    [setSessions]
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

  const handleAddNutritionEntry = useCallback(
    (entry) => {
      setNutrition((prev) => [...prev, entry]);
    },
    [setNutrition]
  );

  const handleDeleteNutritionEntry = useCallback(
    (id) => {
      setNutrition((prev) => prev.filter((e) => e.id !== id));
    },
    [setNutrition]
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
          onDeleteSet={handleDeleteSet}
          onNotesChange={handleNotesChange}
          fridayPicks={fridayPicks}
          onSaveFridayPicks={handleSaveFridayPicks}
          onGoToNutrition={() => setTab("nutrition")}
        />
      )}
      {tab === "week" && <Weekly sessions={sessions} />}
      {tab === "nutrition" && (
        <Nutrition
          entries={nutrition}
          targets={nutritionTargets}
          onAddEntry={handleAddNutritionEntry}
          onDeleteEntry={handleDeleteNutritionEntry}
          onUpdateTargets={setNutritionTargets}
        />
      )}

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
