import { useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { todayISO, formatDisplayDate, formatShortDate } from "../utils/date";
import { makeId } from "../utils/id";
import { entriesForDate, totalsForDate, dailyTotalsSeries } from "../utils/nutritionOps";
import { useFoodScan } from "../hooks/useFoodScan";
import { IconClose, IconCamera } from "../components/icons";

function ProgressRing({ value, target, size = 104, stroke = 10 }) {
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  const offset = circumference * (1 - pct);
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-raised)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="var(--accent)"
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 0.4s ease" }}
      />
    </svg>
  );
}

function ChartTooltip({ active, payload, label, unit }) {
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
      <div style={{ fontWeight: 700, color: "var(--text)" }}>
        {payload[0].value} {unit}
      </div>
    </div>
  );
}

export default function Nutrition({ entries, targets, onAddEntry, onDeleteEntry, onUpdateTargets }) {
  const date = todayISO();
  const todays = entriesForDate(entries, date);
  const totals = totalsForDate(entries, date);

  const [label, setLabel] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [targetCalories, setTargetCalories] = useState(String(targets.calories));
  const [targetProtein, setTargetProtein] = useState(String(targets.protein));
  const [scanConfidence, setScanConfidence] = useState(null);
  const fileInputRef = useRef(null);
  const { scan, scanning, error: scanError, clearError: clearScanError } = useFoodScan();

  function handleAdd() {
    const cals = calories === "" ? null : parseInt(calories, 10);
    const prot = protein === "" ? null : parseInt(protein, 10);
    if (cals == null && prot == null) return;
    onAddEntry({ id: makeId(), date, label: label.trim(), calories: cals, protein: prot });
    setLabel("");
    setCalories("");
    setProtein("");
    setScanConfidence(null);
  }

  async function handlePhotoSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file) return;
    setScanConfidence(null);
    const result = await scan(file);
    if (!result) return;
    if (result.label) setLabel(result.label);
    setCalories(String(result.calories));
    setProtein(String(result.protein));
    setScanConfidence(result.confidence);
  }

  function handleTargetBlur() {
    const c = parseInt(targetCalories, 10) || 0;
    const p = parseInt(targetProtein, 10) || 0;
    onUpdateTargets({ calories: c, protein: p });
  }

  const series = dailyTotalsSeries(entries).map((d) => ({ ...d, dateLabel: formatShortDate(d.date) }));

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="eyebrow">Nutrition</div>
        <h1 className="title-xl">Today's Intake</h1>
        <p className="subtitle">{formatDisplayDate(date)}</p>
      </div>

      <div className="card nutrition-rings-card">
        <div className="ring-block">
          <ProgressRing value={totals.calories} target={targets.calories} />
          <div className="ring-value">
            {totals.calories}
            <span className="ring-target"> / {targets.calories}</span>
          </div>
          <div className="ring-label">kcal</div>
        </div>
        <div className="ring-block">
          <ProgressRing value={totals.protein} target={targets.protein} />
          <div className="ring-value">
            {totals.protein}
            <span className="ring-target"> / {targets.protein}</span>
          </div>
          <div className="ring-label">protein (g)</div>
        </div>
      </div>

      <div className="card">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: "none" }}
          onChange={handlePhotoSelected}
        />
        <button
          className="btn btn-secondary btn-block"
          onClick={() => fileInputRef.current?.click()}
          disabled={scanning}
          style={{ marginBottom: 14 }}
        >
          <IconCamera width={16} height={16} />
          {scanning ? "Analyzing photo..." : "Scan Food Photo"}
        </button>

        {scanError && (
          <p className="scan-error" onClick={clearScanError}>
            {scanError}
          </p>
        )}

        {scanConfidence && !scanError && (
          <p className="scan-note">
            AI estimate ({scanConfidence} confidence) — review the numbers below before saving.
          </p>
        )}

        <div className="form-row">
          <div className="form-field">
            <label>Calories</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={calories}
              onChange={(e) => setCalories(e.target.value.replace(/[^0-9]/g, ""))}
            />
          </div>
          <div className="form-field">
            <label>Protein (g)</label>
            <input
              type="text"
              inputMode="numeric"
              placeholder="0"
              value={protein}
              onChange={(e) => setProtein(e.target.value.replace(/[^0-9]/g, ""))}
            />
          </div>
        </div>
        <div className="form-field" style={{ marginBottom: 12 }}>
          <label>Label (optional)</label>
          <input type="text" placeholder="e.g. Breakfast" value={label} onChange={(e) => setLabel(e.target.value)} />
        </div>
        <button className="btn btn-primary btn-block" onClick={handleAdd} disabled={calories === "" && protein === ""}>
          Add Entry
        </button>
      </div>

      {todays.length > 0 && (
        <>
          <div className="section-label">Today's Entries</div>
          <div className="card">
            {todays.map((e) => (
              <div className="nutrition-row" key={e.id}>
                <div>
                  <div className="nutrition-row-label">{e.label || "Entry"}</div>
                  <div className="nutrition-row-detail">
                    {e.calories != null ? `${e.calories} kcal` : ""}
                    {e.calories != null && e.protein != null ? " · " : ""}
                    {e.protein != null ? `${e.protein}g protein` : ""}
                  </div>
                </div>
                <button className="set-delete-btn" onClick={() => onDeleteEntry(e.id)} aria-label="Delete entry">
                  <IconClose width={14} height={14} />
                </button>
              </div>
            ))}
          </div>
        </>
      )}

      <div className="section-label">Daily Targets</div>
      <div className="card">
        <div className="form-row" style={{ marginBottom: 0 }}>
          <div className="form-field">
            <label>Calories</label>
            <input
              type="text"
              inputMode="numeric"
              value={targetCalories}
              onChange={(e) => setTargetCalories(e.target.value.replace(/[^0-9]/g, ""))}
              onBlur={handleTargetBlur}
            />
          </div>
          <div className="form-field">
            <label>Protein (g)</label>
            <input
              type="text"
              inputMode="numeric"
              value={targetProtein}
              onChange={(e) => setTargetProtein(e.target.value.replace(/[^0-9]/g, ""))}
              onBlur={handleTargetBlur}
            />
          </div>
        </div>
      </div>

      {series.length >= 2 && (
        <>
          <div className="section-label">Calories Trend</div>
          <div className="card" style={{ height: 180, padding: "16px 8px 8px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 4, right: 12, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="dateLabel" stroke="var(--text-tertiary)" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-tertiary)" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} tickLine={false} axisLine={false} width={34} />
                <Tooltip content={<ChartTooltip unit="kcal" />} />
                <Line type="monotone" dataKey="calories" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--accent)", strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className="section-label">Protein Trend</div>
          <div className="card" style={{ height: 180, padding: "16px 8px 8px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 4, right: 12, bottom: 0, left: -18 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="dateLabel" stroke="var(--text-tertiary)" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-tertiary)" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} tickLine={false} axisLine={false} width={34} />
                <Tooltip content={<ChartTooltip unit="g" />} />
                <Line type="monotone" dataKey="protein" stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--accent)", strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
