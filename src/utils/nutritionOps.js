// A nutrition entry is one logged item ({ id, date, label, calories, protein }) —
// multiple can exist per day (breakfast, lunch, a snack...) and get summed for
// that day's totals, unlike body weight which is naturally one reading a day.

export function entriesForDate(entries, date) {
  return entries.filter((e) => e.date === date);
}

export function totalsForDate(entries, date) {
  return entriesForDate(entries, date).reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories || 0),
      protein: acc.protein + (e.protein || 0),
    }),
    { calories: 0, protein: 0 }
  );
}

// Daily totals across all history, sorted oldest to newest — for trend charts.
export function dailyTotalsSeries(entries) {
  const byDate = {};
  for (const e of entries) {
    if (!byDate[e.date]) byDate[e.date] = { date: e.date, calories: 0, protein: 0 };
    byDate[e.date].calories += e.calories || 0;
    byDate[e.date].protein += e.protein || 0;
  }
  return Object.values(byDate).sort((a, b) => (a.date < b.date ? -1 : 1));
}
