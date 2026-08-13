import { useMemo, useState } from "react";
import { getWeekDates, toISODate, todayISO, formatDisplayDate } from "../utils/date";
import { dayInfoForDate } from "../utils/date";
import { datesWithSessions } from "../utils/sessionOps";
import { IconCheck, IconChevronLeft, IconChevronRight } from "../components/icons";

export default function Weekly({ sessions }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const today = todayISO();

  const anchor = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDates = getWeekDates(anchor);
  const loggedDates = useMemo(() => datesWithSessions(sessions), [sessions]);

  const workoutDaysThisWeek = weekDates.filter((d) => dayInfoForDate(d).type !== "rest");
  const completedCount = workoutDaysThisWeek.filter((d) => loggedDates.has(toISODate(d))).length;

  const rangeLabel = `${formatDisplayDate(toISODate(weekDates[0]))} – ${formatDisplayDate(toISODate(weekDates[6]))}`;

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="eyebrow">Weekly Overview</div>
        <h1 className="title-xl">This Week</h1>
      </div>

      <div className="week-nav">
        <button onClick={() => setWeekOffset((w) => w - 1)} aria-label="Previous week">
          <IconChevronLeft />
        </button>
        <span style={{ fontSize: 13, color: "var(--text-secondary)", fontWeight: 600 }}>{rangeLabel}</span>
        <button onClick={() => setWeekOffset((w) => w + 1)} aria-label="Next week">
          <IconChevronRight />
        </button>
      </div>

      <div className="stat-row" style={{ marginBottom: 20 }}>
        <div className="stat-tile">
          <div className="value">
            {completedCount}/{workoutDaysThisWeek.length}
          </div>
          <div className="label">Days Trained</div>
        </div>
        <div className="stat-tile">
          <div className="value">{Math.round((completedCount / Math.max(workoutDaysThisWeek.length, 1)) * 100)}%</div>
          <div className="label">Consistency</div>
        </div>
      </div>

      <div className="week-grid">
        {weekDates.map((date) => {
          const iso = toISODate(date);
          const dayInfo = dayInfoForDate(date);
          const isRest = dayInfo.type === "rest";
          const isDone = loggedDates.has(iso);
          const isFuture = iso > today;
          const isToday = iso === today;

          let status = "rest";
          if (!isRest) {
            if (isDone) status = "done";
            else if (isFuture) status = "future";
            else status = "missed";
          }

          return (
            <div className={`week-cell${isToday ? " is-today" : ""}`} key={iso}>
              <div className="week-cell-day">{dayInfo.label.slice(0, 3)}</div>
              <div className={`week-status-dot ${status === "future" ? "" : status}`}>
                {status === "done" && <IconCheck />}
              </div>
              <div className="week-cell-date">{date.getDate()}</div>
            </div>
          );
        })}
      </div>

      <div className="section-label">Legend</div>
      <div className="chip-row">
        <span className="chip">
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: 999,
              background: "var(--accent)",
              marginRight: 6,
            }}
          />
          Completed
        </span>
        <span className="chip">
          <span
            style={{
              display: "inline-block",
              width: 8,
              height: 8,
              borderRadius: 999,
              border: "1px solid var(--border-strong)",
              marginRight: 6,
            }}
          />
          Missed
        </span>
        <span className="chip">Rest day</span>
      </div>
    </div>
  );
}
