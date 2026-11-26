import { useEffect, useRef, useState } from "react";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from "recharts";
import { todayISO, formatDisplayDate, formatShortDate } from "../utils/date";
import { makeId } from "../utils/id";
import {
  totalsForDate,
  dailyTotalsSeries,
  groupEntriesByMealType,
  MEAL_TYPES,
  MEAL_TYPE_META,
  currentMealType,
} from "../utils/nutritionOps";
import { useFoodScan } from "../hooks/useFoodScan";
import { parseMacrosFromText } from "../utils/parseMacros";
import { IconClose, IconCamera, IconPlus } from "../components/icons";
import Sheet from "../components/Sheet";

const DEFAULT_TARGETS = { calories: 2200, protein: 150, carbs: 250, fat: 70, fiber: 30 };

// Rings start empty and sweep to their value on first paint.
function useEntered() {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const id = requestAnimationFrame(() => requestAnimationFrame(() => setEntered(true)));
    return () => cancelAnimationFrame(id);
  }, []);
  return entered;
}

function ProgressRing({ value, target, size = 104, stroke = 10, color = "var(--accent)" }) {
  const entered = useEntered();
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = target > 0 ? Math.min(value / target, 1) : 0;
  const offset = circumference * (1 - (entered ? pct : 0));
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="var(--surface-raised)" strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.32, 0.72, 0, 1)" }}
      />
    </svg>
  );
}

function MacroPill({ label, value, target }) {
  const entered = useEntered();
  const pct = entered && target > 0 ? Math.min(value / target, 1) : 0;
  return (
    <div className="macro-pill">
      <div className="macro-pill-icon">
        <svg width={14} height={14} viewBox="0 0 36 36">
          <circle cx="18" cy="18" r="15" fill="none" stroke="var(--border-strong)" strokeWidth="4" />
          <circle
            cx="18"
            cy="18"
            r="15"
            fill="none"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 15}
            strokeDashoffset={2 * Math.PI * 15 * (1 - pct)}
            style={{ transition: "stroke-dashoffset 1s cubic-bezier(0.32, 0.72, 0, 1) 0.15s" }}
            transform="rotate(-90 18 18)"
          />
        </svg>
      </div>
      <div>
        <div className="macro-pill-value">
          {value}
          <span>/{target}g</span>
        </div>
        <div className="macro-pill-label">{label}</div>
      </div>
    </div>
  );
}

function ChartTooltip({ active, payload, label, unit }) {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--surface)",
        boxShadow: "var(--shadow-float)",
        borderRadius: 12,
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

function macroDetail(e) {
  const parts = [];
  if (e.calories != null) parts.push(`${e.calories} kcal`);
  if (e.protein != null) parts.push(`${e.protein}g protein`);
  if (e.carbs != null) parts.push(`${e.carbs}g carbs`);
  if (e.fat != null) parts.push(`${e.fat}g fat`);
  if (e.fiber != null) parts.push(`${e.fiber}g fiber`);
  return parts.join(" · ");
}

export default function Nutrition({ entries, targets, onAddEntry, onDeleteEntry, onUpdateEntry, onUpdateTargets }) {
  const date = todayISO();
  const totals = totalsForDate(entries, date);
  // Older saved targets may predate carbs/fat/fiber tracking — fill in sane defaults.
  const t = { ...DEFAULT_TARGETS, ...targets };
  const mealGroups = groupEntriesByMealType(entries, date);

  const [addOpen, setAddOpen] = useState(false);
  // Set when the sheet is editing an existing entry instead of adding one.
  const [editingId, setEditingId] = useState(null);
  const [targetsOpen, setTargetsOpen] = useState(false);
  const [trend, setTrend] = useState("calories");
  const [mealType, setMealType] = useState(() => currentMealType());
  const [label, setLabel] = useState("");
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [fiber, setFiber] = useState("");
  const [targetCalories, setTargetCalories] = useState(String(t.calories));
  const [targetProtein, setTargetProtein] = useState(String(t.protein));
  const [targetCarbs, setTargetCarbs] = useState(String(t.carbs));
  const [targetFat, setTargetFat] = useState(String(t.fat));
  const [targetFiber, setTargetFiber] = useState(String(t.fiber));
  const [scanConfidence, setScanConfidence] = useState(null);
  const [scanSource, setScanSource] = useState(null);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [pasteNote, setPasteNote] = useState("");
  const [pasteNoteIsError, setPasteNoteIsError] = useState(false);
  const fileInputRef = useRef(null);
  const { scan, estimateFromText, scanning, error: scanError, clearError: clearScanError } = useFoodScan();

  function toIntOrNull(v) {
    return v === "" ? null : parseInt(v, 10);
  }

  function handleAdd() {
    const cals = toIntOrNull(calories);
    const prot = toIntOrNull(protein);
    const carb = toIntOrNull(carbs);
    const ft = toIntOrNull(fat);
    const fib = toIntOrNull(fiber);
    if (cals == null && prot == null && carb == null && ft == null && fib == null) return;
    const fields = {
      label: label.trim(),
      calories: cals,
      protein: prot,
      carbs: carb,
      fat: ft,
      fiber: fib,
      mealType,
    };
    if (editingId) onUpdateEntry?.({ id: editingId, ...fields });
    else onAddEntry({ id: makeId(), date, ...fields });
    setEditingId(null);
    setLabel("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setFiber("");
    setScanConfidence(null);
    setScanSource(null);
    setPasteNote("");
    setPasteOpen(false);
    setAddOpen(false);
  }

  const str = (v) => (v == null ? "" : String(v));

  function resetForm() {
    setLabel("");
    setCalories("");
    setProtein("");
    setCarbs("");
    setFat("");
    setFiber("");
    setScanConfidence(null);
    setScanSource(null);
    setPasteNote("");
    setPasteOpen(false);
  }

  function openAdd() {
    setEditingId(null);
    resetForm();
    setMealType(currentMealType());
    setAddOpen(true);
  }

  // Tap a logged meal to edit it in the same sheet, prefilled.
  function openEdit(entry) {
    resetForm();
    setEditingId(entry.id);
    setMealType(entry.mealType || currentMealType());
    setLabel(entry.label || "");
    setCalories(str(entry.calories));
    setProtein(str(entry.protein));
    setCarbs(str(entry.carbs));
    setFat(str(entry.fat));
    setFiber(str(entry.fiber));
    setAddOpen(true);
  }

  function closeSheet() {
    setAddOpen(false);
    if (editingId) {
      setEditingId(null);
      resetForm();
    }
  }

  async function handlePhotoSelected(e) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow picking the same file again later
    if (!file) return;
    setScanConfidence(null);
    setScanSource(null);
    setPasteNote("");
    const result = await scan(file);
    if (!result) return;
    if (result.label) setLabel(result.label);
    setCalories(String(result.calories));
    setProtein(String(result.protein));
    if (result.carbs != null) setCarbs(String(result.carbs));
    if (result.fat != null) setFat(String(result.fat));
    if (result.fiber != null) setFiber(String(result.fiber));
    setScanConfidence(result.confidence);
    setScanSource(result.source || "estimate");
  }

  async function handleEstimateFromText() {
    const description = label.trim();
    if (!description) return;
    setScanConfidence(null);
    setScanSource(null);
    setPasteNote("");
    const result = await estimateFromText(description);
    if (!result) return;
    if (result.label) setLabel(result.label);
    setCalories(String(result.calories));
    setProtein(String(result.protein));
    if (result.carbs != null) setCarbs(String(result.carbs));
    if (result.fat != null) setFat(String(result.fat));
    if (result.fiber != null) setFiber(String(result.fiber));
    setScanConfidence(result.confidence);
    setScanSource(result.source || "estimate");
  }

  function handleParsePaste() {
    const found = parseMacrosFromText(pasteText);
    const keys = Object.keys(found);
    if (keys.length === 0) {
      setPasteNoteIsError(true);
      setPasteNote("Couldn't find any macro numbers in that text — try a different format, or fill in the fields manually below.");
      return;
    }
    if (found.calories != null) setCalories(String(found.calories));
    if (found.protein != null) setProtein(String(found.protein));
    if (found.carbs != null) setCarbs(String(found.carbs));
    if (found.fat != null) setFat(String(found.fat));
    if (found.fiber != null) setFiber(String(found.fiber));
    setScanConfidence(null);
    setScanSource(null);
    clearScanError();
    setPasteNoteIsError(false);
    setPasteNote(`Filled ${keys.length}/5 fields from the pasted text — review the numbers below before saving.`);
    setPasteText("");
    setPasteOpen(false);
  }

  function handleTargetBlur() {
    onUpdateTargets({
      calories: parseInt(targetCalories, 10) || 0,
      protein: parseInt(targetProtein, 10) || 0,
      carbs: parseInt(targetCarbs, 10) || 0,
      fat: parseInt(targetFat, 10) || 0,
      fiber: parseInt(targetFiber, 10) || 0,
    });
  }

  const allFieldsBlank = calories === "" && protein === "" && carbs === "" && fat === "" && fiber === "";
  const series = dailyTotalsSeries(entries).map((d) => ({ ...d, dateLabel: formatShortDate(d.date) }));
  const over = totals.calories > t.calories;
  const heroValue = over ? totals.calories - t.calories : Math.max(t.calories - totals.calories, 0);

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="eyebrow">{formatDisplayDate(date)}</div>
        <h1 className="title-xl">Today's Intake</h1>
      </div>

      <div className="card nutri-hero">
        <div className="card-head">
          <div className="card-head-title">Calories</div>
          <button className="pill-btn" onClick={() => setTargetsOpen(true)}>
            Edit targets
          </button>
        </div>
        <div className="nutri-hero-ring">
          <ProgressRing value={totals.calories} target={t.calories} size={168} stroke={14} />
          <div className="nutri-hero-ring-center">
            <div className="nutri-hero-ring-value">{heroValue}</div>
            <div className="nutri-hero-ring-label">{over ? "kcal over" : "kcal left"}</div>
          </div>
        </div>
        <div className="nutri-hero-eaten">
          {totals.calories} / {t.calories} kcal eaten today
        </div>

      </div>

      <div className="macro-grid">
        <MacroPill label="Protein" value={totals.protein} target={t.protein} />
        <MacroPill label="Carbs" value={totals.carbs} target={t.carbs} />
        <MacroPill label="Fat" value={totals.fat} target={t.fat} />
        <MacroPill label="Fiber" value={totals.fiber} target={t.fiber} />
      </div>

      <div className="section-head">
        <h2 className="section-title">Meals</h2>
        <button className="pill-btn" onClick={openAdd}>
          <IconPlus width={14} height={14} /> Add food
        </button>
      </div>

      {mealGroups.length > 0 ? (
        mealGroups.map((group) => (
          <div className="meal-group" key={group.type}>
            <div className="meal-group-header">
              <div className="meal-icon-bubble">{group.emoji}</div>
              <div className="meal-group-name">{group.label}</div>
              <div className="meal-group-total">{group.totalCalories} kcal</div>
            </div>
            <div className="card">
              {group.entries.map((e) => (
                <div className="nutrition-row" key={e.id}>
                  <button className="nutrition-row-edit" onClick={() => openEdit(e)} aria-label={`Edit ${e.label || group.label}`}>
                    <span className="nutrition-row-icon">{group.emoji}</span>
                    <span className="nutrition-row-main">
                      <span className="nutrition-row-label">{e.label || group.label}</span>
                      <span className="nutrition-row-detail">{macroDetail(e)}</span>
                    </span>
                    <span className="nutrition-row-pen" aria-hidden="true">✎</span>
                  </button>
                  <button className="set-delete-btn" onClick={() => onDeleteEntry(e.id)} aria-label="Delete entry">
                    <IconClose width={14} height={14} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ))
      ) : (
        <button className="card empty-card" onClick={openAdd}>
          <span className="empty-card-icon">🍽️</span>
          <span className="empty-card-title">Nothing logged yet today</span>
          <span className="empty-card-sub">Tap to add — scan a photo, type it, or paste macros.</span>
        </button>
      )}

      {series.length >= 2 && (
        <>
          <div className="section-head">
            <h2 className="section-title">Trend</h2>
            <div className="segmented">
              {[
                ["calories", "Calories"],
                ["protein", "Protein"],
              ].map(([key, text]) => (
                <button key={key} className={trend === key ? "active" : ""} onClick={() => setTrend(key)}>
                  {text}
                </button>
              ))}
            </div>
          </div>
          <div className="card" style={{ height: 200, padding: "18px 10px 10px" }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={series} margin={{ top: 4, right: 12, bottom: 0, left: -6 }}>
                <CartesianGrid stroke="var(--border)" vertical={false} />
                <XAxis dataKey="dateLabel" stroke="var(--text-tertiary)" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--text-tertiary)" tick={{ fontSize: 11, fill: "var(--text-tertiary)" }} tickLine={false} axisLine={false} width={40} />
                <Tooltip content={<ChartTooltip unit={trend === "calories" ? "kcal" : "g"} />} />
                <Line type="monotone" dataKey={trend} stroke="var(--accent)" strokeWidth={2.5} dot={{ r: 3, fill: "var(--accent)", strokeWidth: 0 }} activeDot={{ r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </>
      )}

      {addOpen && (
        <Sheet
          title={editingId ? "Edit Food" : "Add Food"}
          onClose={closeSheet}
          footer={
            <div className="sheet-footer-row">
              {editingId && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    onDeleteEntry(editingId);
                    closeSheet();
                  }}
                >
                  Delete
                </button>
              )}
              <button className="btn btn-primary btn-block" onClick={handleAdd} disabled={allFieldsBlank}>
                {editingId ? "Save Changes" : "Add Entry"}
              </button>
            </div>
          }
        >
          <div className="chip-row" style={{ marginBottom: 14 }}>
            {MEAL_TYPES.map((type) => (
              <button
                key={type}
                className={`chip${mealType === type ? " active" : ""}`}
                onClick={() => setMealType(type)}
              >
                {MEAL_TYPE_META[type].emoji} {MEAL_TYPE_META[type].label}
              </button>
            ))}
          </div>

          <div className="form-field" style={{ marginBottom: 14 }}>
            <label>What did you eat?</label>
            <input
              type="text"
              placeholder="e.g. Chicken Rice, or nasi lemak with 2 eggs"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            style={{ display: "none" }}
            onChange={handlePhotoSelected}
          />
          <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={() => fileInputRef.current?.click()}
              disabled={scanning}
            >
              <IconCamera width={16} height={16} />
              {scanning ? "Working..." : "Scan Photo/Label"}
            </button>
            <button
              className="btn btn-secondary"
              style={{ flex: 1 }}
              onClick={handleEstimateFromText}
              disabled={scanning || !label.trim()}
            >
              {scanning ? "Working..." : "Estimate with AI"}
            </button>
          </div>

          <button
            className="btn btn-ghost btn-block"
            style={{ marginBottom: pasteOpen ? 10 : 14, justifyContent: "flex-start", padding: "4px 2px", minHeight: 28 }}
            onClick={() => {
              setPasteOpen((v) => !v);
              setPasteNote("");
            }}
          >
            {pasteOpen ? "Cancel pasting macro info" : "Or paste macro info from a label or app"}
          </button>

          {pasteOpen && (
            <div style={{ marginBottom: 14 }}>
              <textarea
                className="note-input"
                style={{ marginTop: 0, minHeight: 80 }}
                placeholder={"Paste nutrition text here, e.g.\nEnergy 250kcal, Protein 10g, Carbohydrate 30g, Fat 8g, Fiber 2g"}
                value={pasteText}
                onChange={(e) => setPasteText(e.target.value)}
                autoFocus
              />
              <button
                className="btn btn-secondary btn-block"
                style={{ marginTop: 10 }}
                onClick={handleParsePaste}
                disabled={!pasteText.trim()}
              >
                Fill Fields From Pasted Text
              </button>
            </div>
          )}

          {scanError && (
            <p className="scan-error" onClick={clearScanError}>
              {scanError}
            </p>
          )}

          {scanConfidence && !scanError && (
            <p className="scan-note">
              {scanSource === "label"
                ? "Read from the nutrition label — double-check it matches your serving before saving."
                : `AI estimate (${scanConfidence} confidence) — review the numbers below before saving.`}
            </p>
          )}

          {pasteNote && (
            <p className={pasteNoteIsError ? "scan-error" : "scan-note"} onClick={() => setPasteNote("")}>
              {pasteNote}
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
          <div className="form-row">
            <div className="form-field">
              <label>Carbs (g)</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={carbs}
                onChange={(e) => setCarbs(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </div>
            <div className="form-field">
              <label>Fat (g)</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={fat}
                onChange={(e) => setFat(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </div>
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <div className="form-field">
              <label>Fiber (g)</label>
              <input
                type="text"
                inputMode="numeric"
                placeholder="0"
                value={fiber}
                onChange={(e) => setFiber(e.target.value.replace(/[^0-9]/g, ""))}
              />
            </div>
            <div className="form-field" />
          </div>
        </Sheet>
      )}

      {targetsOpen && (
        <Sheet title="Daily Targets" onClose={() => setTargetsOpen(false)}>
          <div className="form-row">
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
          <div className="form-row">
            <div className="form-field">
              <label>Carbs (g)</label>
              <input
                type="text"
                inputMode="numeric"
                value={targetCarbs}
                onChange={(e) => setTargetCarbs(e.target.value.replace(/[^0-9]/g, ""))}
                onBlur={handleTargetBlur}
              />
            </div>
            <div className="form-field">
              <label>Fat (g)</label>
              <input
                type="text"
                inputMode="numeric"
                value={targetFat}
                onChange={(e) => setTargetFat(e.target.value.replace(/[^0-9]/g, ""))}
                onBlur={handleTargetBlur}
              />
            </div>
          </div>
          <div className="form-row" style={{ marginBottom: 0 }}>
            <div className="form-field">
              <label>Fiber (g)</label>
              <input
                type="text"
                inputMode="numeric"
                value={targetFiber}
                onChange={(e) => setTargetFiber(e.target.value.replace(/[^0-9]/g, ""))}
                onBlur={handleTargetBlur}
              />
            </div>
            <div className="form-field" />
          </div>
        </Sheet>
      )}
    </div>
  );
}
