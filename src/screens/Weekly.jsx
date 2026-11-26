import { useMemo, useState } from "react";
import { getWeekDates, toISODate, todayISO, formatShortDate } from "../utils/date";
import { dayInfoForDate } from "../utils/date";
import { datesWithSessions } from "../utils/sessionOps";
import { IconCheck, IconChevronLeft, IconChevronRight } from "../components/icons";

const STATUS_LABEL = { done: "Done", missed: "Missed", future: "Upcoming", today: "Today", rest: "Rest" };

export default function Weekly({ sessions, dayOverrides = {} }) {
  const [weekOffset, setWeekOffset] = useState(0);
  const today = todayISO();

  const anchor = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + weekOffset * 7);
    return d;
  }, [weekOffset]);

  const weekDates = getWeekDates(anchor);
  const loggedDates = useMemo(() => datesWithSessions(sessions), [sessions]);

  const workoutDaysThisWeek = weekDates.filter((d) => dayInfoForDate(d, dayOverrides).type !== "rest");
  const completedCount = workoutDaysThisWeek.filter((d) => loggedDates.has(toISODate(d))).length;

  const rangeLabel = `${formatShortDate(toISODate(weekDates[0]))} – ${formatShortDate(toISODate(weekDates[6]))}`;

  function statusFor(date) {
    const iso = toISODate(date);
    const dayInfo = dayInfoForDate(date, dayOverrides);
    if (dayInfo.type === "rest") return "rest";
    if (loggedDates.has(iso)) return "done";
    if (iso === today) return "today";
    if (iso > today) return "future";
    return "missed";
  }

  return (
    <div className="screen">
      <div className="screen-header">
        <div className="eyebrow">Weekly overview</div>
        <h1 className="title-xl">{weekOffset === 0 ? "This Week" : weekOffset === -1 ? "Last Week" : weekOffset === 1 ? "Next Week" : "Week"}</h1>
      </div>

      <div className="week-nav">
        <button onClick={() => setWeekOffset((w) => w - 1)} aria-label="Previous week">
          <IconChevronLeft />
        </button>
        <span className="week-range">{rangeLabel}</span>
        <button onClick={() => setWeekOffset((w) => w + 1)} aria-label="Next week">
          <IconChevronRight />
        </button>
      </div>

      <div className="stat-row">
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

      <h2 className="section-title">Schedule</h2>
      <div className="card schedule-card">
        {weekDates.map((date) => {
          const iso = toISODate(date);
          const dayInfo = dayInfoForDate(date, dayOverrides);
          const status = statusFor(date);
          return (
            <div className={`schedule-row${iso === today ? " is-today" : ""}`} key={iso}>
              <div className="schedule-date">
                <div className="schedule-date-day">{dayInfo.label.slice(0, 3)}</div>
                <div className="schedule-date-num">{date.getDate()}</div>
              </div>
              <div className="schedule-main">
                <div className="schedule-focus">{dayInfo.type === "rest" ? "Rest" : dayInfo.focus}</div>
                {(dayInfo.type !== "rest" || dayInfo.overridden) && (
                  <div className="schedule-meta">
                    {dayInfo.overridden ? "Ditukar" : ""}
                    {dayInfo.overridden && dayInfo.type !== "rest" ? " · " : ""}
                    {dayInfo.type !== "rest" ? `Rest ${dayInfo.rest}` : ""}
                  </div>
                )}
              </div>
              <span className={`status-pill ${status}`}>
                {status === "done" && <IconCheck width={12} height={12} />}
                {STATUS_LABEL[status]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
