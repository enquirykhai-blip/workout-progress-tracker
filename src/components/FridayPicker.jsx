import { useMemo, useState } from "react";
import Sheet from "./Sheet";
import { IconCheck, IconSearch } from "./icons";
import { EXERCISES, DAYS } from "../data/exercises";

const DAY_LABEL = Object.fromEntries(DAYS.map((d) => [d.key, d.label]));

export default function FridayPicker({ initialPicks, onClose, onSave }) {
  const [query, setQuery] = useState("");
  const [picks, setPicks] = useState(initialPicks);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return EXERCISES;
    return EXERCISES.filter((e) => e.name.toLowerCase().includes(q));
  }, [query]);

  function toggle(id) {
    setPicks((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]));
  }

  return (
    <Sheet
      title="Pick Today's Exercises"
      onClose={() => {
        onSave(picks);
        onClose();
      }}
      footer={
        <button
          className="btn btn-primary btn-block"
          onClick={() => {
            onSave(picks);
            onClose();
          }}
        >
          Save {picks.length ? `(${picks.length} selected)` : ""}
        </button>
      }
    >
      <div className="search-input-wrap" style={{ marginBottom: 12 }}>
        <IconSearch className="search-icon" />
        <input
          type="text"
          placeholder="Search exercises..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>
      {filtered.map((ex) => {
        const checked = picks.includes(ex.id);
        return (
          <div className="pick-row" key={ex.id} onClick={() => toggle(ex.id)} style={{ cursor: "pointer" }}>
            <div>
              <div className="pick-row-name">{ex.name}</div>
              <div className="pick-row-day">{DAY_LABEL[ex.day]}</div>
            </div>
            <div className={`checkbox${checked ? " checked" : ""}`}>{checked && <IconCheck />}</div>
          </div>
        );
      })}
      {filtered.length === 0 && (
        <div className="empty-state">
          <div className="icon">🔍</div>
          <p>No exercises match "{query}"</p>
        </div>
      )}
    </Sheet>
  );
}
