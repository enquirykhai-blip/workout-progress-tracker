import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { EXERCISES } from "../data/exercises";
import { sessionsForExercise, maxWeightInSession, getBestSet } from "../utils/sessionOps";
import { formatShortDate, formatDisplayDate } from "../utils/date";
import { IconSearch } from "../components/icons";

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border-strong)",
        borderRadius: 10,
        padding: "8px 12px",
        fontSize: 12,
      }}
    >
      <div style={{ color: "var(--text-secondary)", marginBottom: 2 }}>{label}</div>
      <div style={{ fontWeight: 700, color: "var(--text)" }}>{payload[0].value} kg</div>
    </div>
  );
}

export default function Progress({ sessions }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const recentIds = useMemo(() => {
    const seen = [];
    for (const s of sessions.slice().sort((a, b) => (a.date < b.date ? 1 : -1))) {
      if (s.sets.length === 0) continue;
      if (!seen.includes(s.exerciseId)) seen.push(s.exerciseId);
      if (seen.length >= 6) break;
    }
    return seen;
  }, [sessions]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return EXERCISES.filter((e) => e.name.toLowerCase().includes(q)).slice(0, 8);
  }, [query]);

  const selected = EXERCISES.find((e) => e.id === selectedId);
  const history = selected ? sessionsForExercise(sessions, selected.id) : [];
  const best = selected ? getBestSet(sessions, selected.id) : null;

  const chartData = history
    .slice()
    .sort((a, b) => (a.date < b.date ? -1 : 1))
    .map((s) => ({ date: formatShortDate(s.date), weight: maxWeightInSession(s) }));

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="eyebrow">Progress</div>
        <h1 className="title-xl">History & PRs</h1>
      </div>

      <div className="search-input-wrap">
        <IconSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search an exercise..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
          }}
        />
      </div>

      {query.trim() && (
        <div className="card" style={{ padding: 6, marginBottom: 16 }}>
          {filtered.length === 0 && (
            <div style={{ padding: 12, color: "var(--text-secondary)", fontSize: 14 }}>No matches.</div>
          )}
          {filtered.map((e) => (
            <div
              key={e.id}
              className="pick-row"
              style={{ cursor: "pointer", padding: "12px 10px" }}
              onClick={() => {
                setSelectedId(e.id);
                setQuery("");
              }}
            >
              <div className="pick-row-name">{e.name}</div>
            </div>
          ))}
        </div>
      )}

      {!selected && !query.trim() && (
        <>
          <div className="section-label">Recently Logged</div>
          {recentIds.length === 0 ? (
            <div className="empty-state">
              <div className="icon">📈</div>
              <p>Log a set to start seeing progress here.</p>
            </div>
          ) : (
            <div className="chip-row">
              {recentIds.map((id) => {
                const ex = EXERCISES.find((e) => e.id === id);
                return (
                  <button key={id} className="chip" onClick={() => setSelectedId(id)}>
                    {ex.name}
                  </button>
                );
              })}
            </div>
          )}
        </>
      )}

      {selected && (
        <>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="exercise-card-head" style={{ marginBottom: 0 }}>
              <div>
                <div className="exercise-name">{selected.name}</div>
                <div className="exercise-target">{history.length} session{history.length === 1 ? "" : "s"} logged</div>
              </div>
              {best && (
                <div className="exercise-best">
                  PR {best.weight}kg × {best.reps}
                </div>
              )}
            </div>
          </div>

          {chartData.length >= 2 && (
            <div className="card" style={{ height: 220, padding: "16px 8px 8px" }}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 4, right: 12, bottom: 0, left: -18 }}>
                  <CartesianGrid stroke="var(--border)" vertical={false} />
                  <XAxis
                    dataKey="date"
                    stroke="var(--text-tertiary)"
                    tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="var(--text-tertiary)"
                    tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                    tickLine={false}
                    axisLine={false}
                    width={34}
                  />
                  <Tooltip content={<ChartTooltip />} />
                  <Line
                    type="monotone"
                    dataKey="weight"
                    stroke="var(--accent)"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "var(--accent)", strokeWidth: 0 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          <div className="section-label">History</div>
          {history.length === 0 ? (
            <div className="empty-state">
              <div className="icon">🗓️</div>
              <p>No sessions logged yet for this exercise.</p>
            </div>
          ) : (
            <div className="card" style={{ overflowX: "auto" }}>
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Sets (kg × reps)</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((s) => {
                    const top = maxWeightInSession(s);
                    const isPRRow = best && top === best.weight && s.date === best.date;
                    return (
                      <tr key={s.id} className={isPRRow ? "history-row-pr" : ""}>
                        <td>{formatDisplayDate(s.date)}</td>
                        <td>{s.sets.map((set) => `${set.weight}×${set.reps}`).join(", ")}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
}
