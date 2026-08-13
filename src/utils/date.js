import { DAY_BY_JS_DAY } from "../data/exercises";

const MALAY_MONTHS = [
  "Januari", "Februari", "Mac", "April", "Mei", "Jun",
  "Julai", "Ogos", "September", "Oktober", "November", "Disember",
];

export function toISODate(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function todayISO() {
  return toISODate(new Date());
}

export function dayInfoForDate(date) {
  return DAY_BY_JS_DAY[date.getDay()];
}

export function dayKeyForISO(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return DAY_BY_JS_DAY[new Date(y, m - 1, d).getDay()].key;
}

export function formatDisplayDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MALAY_MONTHS[m - 1]} ${y}`;
}

export function formatShortDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  return `${d} ${MALAY_MONTHS[m - 1].slice(0, 3)}`;
}

export function addDays(date, n) {
  const copy = new Date(date);
  copy.setDate(copy.getDate() + n);
  return copy;
}

// Week runs Isnin (Mon) -> Ahad (Sun), matching the split's weekly rhythm.
export function startOfWeek(date) {
  const jsDay = date.getDay(); // 0 = Sunday
  const diffFromMonday = jsDay === 0 ? 6 : jsDay - 1;
  const start = addDays(date, -diffFromMonday);
  start.setHours(0, 0, 0, 0);
  return start;
}

export function getWeekDates(anchorDate) {
  const start = startOfWeek(anchorDate);
  return Array.from({ length: 7 }, (_, i) => addDays(start, i));
}
