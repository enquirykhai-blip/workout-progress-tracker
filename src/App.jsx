import { useCallback, useState } from "react";
import { useCloudState } from "./hooks/useCloudState";
import { useAuth } from "./hooks/useAuth";
import { useRestTimer, resolveRestSeconds } from "./hooks/useRestTimer";
import { useExerciseTimers } from "./hooks/useExerciseTimers";
import { STORAGE_KEYS } from "./utils/storage";
import { upsertSet, updateNotes, isPR, findSession, removeSet } from "./utils/sessionOps";
import { makeId } from "./utils/id";
import { todayISO } from "./utils/date";
import { useLocalStorageState } from "./hooks/useLocalStorageState";
import { IconSettings } from "./components/icons";
import BottomNav from "./components/BottomNav";
import PRToastLayer from "./components/PRToastLayer";
import AuthScreen from "./components/AuthScreen";
import Today from "./screens/Today";
import Weekly from "./screens/Weekly";
import Nutrition from "./screens/Nutrition";

export default function App() {
  const { user, loading, signIn, signUp, signOut } = useAuth();

  // Doherty Threshold: show something instantly instead of a blank screen
  // while the saved session is being restored.
  if (loading)
    return (
      <div className="app-shell">
        <div className="screen">
          <div className="skeleton skeleton-row" />
          <div className="skeleton skeleton-hero" />
          <div className="skeleton skeleton-card" />
        </div>
      </div>
    );
  if (!user) return <AuthScreen signIn={signIn} signUp={signUp} />;

  return <WorkoutApp uid={user.uid} email={user.email} onSignOut={signOut} />;
}

function WorkoutApp({ uid, email, onSignOut }) {
  const [tab, setTab] = useState("today");
  const [sessions, setSessions] = useCloudState(STORAGE_KEYS.SESSIONS, "sessions", [], uid);
  // Per-date program swaps: { "YYYY-MM-DD": programId | "rest" }.
  const [dayOverrides, setDayOverrides] = useCloudState(STORAGE_KEYS.DAY_OVERRIDES, "dayOverrides", {}, uid);
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
  const exerciseTimers = useExerciseTimers();
  const fallbackName = (email || "").split("@")[0];
  const [displayName, setDisplayName] = useLocalStorageState(STORAGE_KEYS.DISPLAY_NAME, "");

  const showToast = useCallback((message) => {
    const id = makeId();
    setToasts((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 1900);
  }, []);

  const handleLogSet = useCallback(
    (exercise, day, setNumber, weight, reps, restSeconds = 120) => {
      const iso = todayISO();
      const wasPR = isPR(sessions, exercise.id, iso, weight, reps);
      setSessions((prev) => upsertSet(prev, { date: iso, day, exerciseId: exercise.id, setNumber, weight, reps }));
      if (wasPR) {
        const detail = weight != null ? `${weight}kg${reps ? ` × ${reps}` : ""}` : `${reps} reps`;
        showToast(`New PR — ${exercise.name}: ${detail}`);
      }
      // Each exercise runs its own rest countdown, started by logging a set.
      exerciseTimers.start(exercise.id, resolveRestSeconds(restTimer.defaultDuration, restSeconds));
      return wasPR;
    },
    [sessions, setSessions, showToast, restTimer.defaultDuration, exerciseTimers]
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
        <IconSettings />
      </button>
      {accountOpen && (
        <div className="account-popover">
          <div className="account-email">{email}</div>
          <div className="account-section-label">Name</div>
          <input
            className="account-name-input"
            type="text"
            placeholder={fallbackName}
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
          />
          <div className="account-section-label">Rest Timer</div>
          <div className="chip-row" style={{ marginBottom: 14 }}>
            {restTimer.presets.map((secs) => (
              <button
                key={secs}
                className={`chip${restTimer.defaultDuration === secs ? " active" : ""}`}
                onClick={() => restTimer.setDefaultDuration(secs)}
              >
                {secs === "auto" ? "Auto" : `${secs}s`}
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
          onGoToNutrition={() => setTab("nutrition")}
          displayName={displayName.trim() || fallbackName}
          dayOverrides={dayOverrides}
          restPreference={restTimer.defaultDuration}
          timers={exerciseTimers}
          onPickProgram={(date, programId) =>
            setDayOverrides((prev) => {
              const next = { ...prev };
              if (programId === undefined) delete next[date];
              else next[date] = programId;
              return next;
            })
          }
        />
      )}
      {tab === "week" && <Weekly sessions={sessions} dayOverrides={dayOverrides} />}
      {tab === "nutrition" && (
        <Nutrition
          entries={nutrition}
          targets={nutritionTargets}
          onAddEntry={handleAddNutritionEntry}
          onDeleteEntry={handleDeleteNutritionEntry}
          onUpdateTargets={setNutritionTargets}
        />
      )}

      <BottomNav active={tab} onChange={setTab} />
    </div>
  );
}
