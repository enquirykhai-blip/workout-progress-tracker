import { useMemo, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { todayISO, formatDisplayDate, formatShortDate } from "../utils/date";
import { makeId } from "../utils/id";

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

export default function BodyWeight({ entries, onAdd }) {
  const [date, setDate] = useState(todayISO());
  const [weight, setWeight] = useState("");

  const sorted = useMemo(() => entries.slice().sort((a, b) => (a.date < b.date ? 1 : -1)), [entries]);
  const chartData = useMemo(
    () =>
      entries
        .slice()
        .sort((a, b) => (a.date < b.date ? -1 : 1))
        .map((e) => ({ date: formatShortDate(e.date), weight: e.weight })),
    [entries]
  );

  function handleAdd() {
    const w = parseFloat(weight);
    if (Number.isNaN(w) || w <= 0 || !date) return;
    onAdd({ id: makeId(), date, weight: w });
    setWeight("");
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="eyebrow">Body Weight</div>
        <h1 className="title-xl">Weight Log</h1>
      </div>

      <div className="card" style={{ marginBottom: 16 }}>
        <div className="form-row">
          <div className="form-field">
            <label>Date</label>
            <input type="date" value={date} max={todayISO()} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div className="form-field">
            <label>Weight (kg)</label>
            <input
              type="text"
              inputMode="decimal"
              placeholder="0.0"
              value={weight}
              onChange={(e) => setWeight(e.target.value.replace(/[^0-9.]/g, ""))}
            />
          </div>
        </div>
        <button className="btn btn-primary btn-block" onClick={handleAdd} disabled={!weight}>
          Log Weight
        </button>
      </div>

      {chartData.length >= 2 && (
        <div className="card" style={{ height: 200, padding: "16px 8px 8px", marginBottom: 16 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 4, right: 12, bottom: 0, left: -6 }}>
              <CartesianGrid stroke="var(--border)" vertical={false} />
              <XAxis dataKey="date" stroke="var(--text-tertiary)" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} tickLine={false} axisLine={false} />
              <YAxis
                stroke="var(--text-tertiary)"
                tick={{ fontSize: 11, fill: "var(--text-tertiary)" }}
                tickLine={false}
                axisLine={false}
                width={40}
                domain={["dataMin - 2", "dataMax + 2"]}
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

      <div className="section-label">Entries</div>
      {sorted.length === 0 ? (
        <div className="empty-state">
          <div className="icon">⚖️</div>
          <p>No body weight entries yet.</p>
        </div>
      ) : (
        <div className="card">
          {sorted.map((entry, i) => {
            const prev = sorted[i + 1];
            const delta = prev ? +(entry.weight - prev.weight).toFixed(1) : null;
            return (
              <div className="bw-row" key={entry.id}>
                <div>
                  <div className="bw-date">{formatDisplayDate(entry.date)}</div>
                  {delta !== null && delta !== 0 && (
                    <div className="bw-delta">
                      {delta < 0 ? "↓" : "↑"} {Math.abs(delta)} kg
                    </div>
                  )}
                </div>
                <div className="bw-weight">{entry.weight} kg</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
